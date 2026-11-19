import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getAllFaqs, type FaqOut } from '@/api/faq';
import {
  ScrollProgressBar,
  ScrollParallaxHero,
  ScrollReveal,
} from '@/components/common/ScrollMotion';

export default function BuyerFaqPage() {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const targetIdParam = searchParams.get('id');

  const [faqs, setFaqs] = useState<FaqOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const scrollToFaq = (id: number) => {
    setTimeout(() => {
      const el = document.getElementById(`faq-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  const loadFaqs = async () => {
    setLoading(true);
    setError(false);
    try {
      // only active FAQs for public Buyer page
      const data = await getAllFaqs(true);
      setFaqs(data);

      const targetId = targetIdParam ? Number(targetIdParam) : null;
      if (targetId && data.some((item) => item.id === targetId)) {
        setOpenId(targetId);
        scrollToFaq(targetId);
      } else if (data.length > 0) {
        setOpenId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load FAQs:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFaqs();
  }, []);

  useEffect(() => {
    if (!targetIdParam || faqs.length === 0) return;
    const targetId = Number(targetIdParam);
    if (faqs.some((item) => item.id === targetId)) {
      setOpenId(targetId);
      scrollToFaq(targetId);
    }
  }, [targetIdParam, faqs]);

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="px-4 py-10 sm:px-6 lg:px-8">
      <ScrollProgressBar />

      <div className="mx-auto max-w-7xl">
        {/* Editorial Header */}
        <ScrollParallaxHero
          icon={MessageCircleQuestion}
          title={t('faq.title', 'Frequently Asked Questions')}
          subtitle={t('faq.subtitle', 'Find answers to common questions about Toti Cakery.')}
        />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl bg-white border border-[#E8DCCB] p-6 sm:p-7 shadow-sm"
              >
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white border border-[#E8DCCB] p-10 sm:p-14 text-center shadow-sm">
            <h3 className="text-xl font-bold text-[#4b2417] mb-2 font-display">
              {t('faq.error_title', 'Unable to load frequently asked questions right now.')}
            </h3>
            <p className="text-[#6f5448] mb-6 font-sans text-sm sm:text-base">
              {t('faq.error_desc', 'Please try again later.')}
            </p>
            <button
              onClick={loadFaqs}
              className="rounded-xl bg-[#d85b30] px-6 py-3 font-bold text-white hover:bg-[#c04e28] transition-colors shadow-sm active:scale-95 cursor-pointer"
            >
              {t('faq.retry', 'Retry')}
            </button>
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E8DCCB] p-10 sm:p-14 text-center shadow-sm">
            <p className="text-base sm:text-lg text-[#6f5448] font-sans">
              {t('faq.empty', 'No frequently asked questions are available right now.')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq, idx) => {
              const isEn = i18n.language?.startsWith('en');
              const question = isEn && faq.pertanyaan_en ? faq.pertanyaan_en : faq.pertanyaan;
              const answer = isEn && faq.jawaban_en ? faq.jawaban_en : faq.jawaban;
              const isOpen = openId === faq.id;
              return (
                <ScrollReveal
                  key={faq.id}
                  delay={Math.min(idx * 55, 275)}
                  direction="up"
                >
                  <div
                    id={`faq-${faq.id}`}
                    className={`w-full overflow-hidden rounded-3xl transition-all duration-300 ${
                      isOpen
                        ? 'border border-[#9B4A2F]/50 shadow-md bg-white'
                        : 'border border-[#E8DCCB] bg-white hover:border-[#E0A04E] hover:shadow-sm'
                    }`}
                  >
                    <button
                      onClick={() => toggleFaq(faq.id)}
                      className="flex w-full items-center justify-between p-6 sm:p-7 text-left focus:outline-none cursor-pointer"
                      aria-expanded={isOpen}
                    >
                      <span className="text-lg sm:text-xl font-bold text-[#3A1F16] font-display pr-4">
                        {question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 text-[#d85b30] transition-transform duration-300 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen
                          ? 'grid-rows-[1fr] opacity-100'
                          : 'grid-rows-[0fr] opacity-0'
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="p-6 sm:p-7 pt-0 border-t border-[#E8DCCB]/40">
                          <p className="text-[#6f5448] leading-relaxed whitespace-pre-wrap font-sans text-sm sm:text-base mt-4">
                            {answer}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
