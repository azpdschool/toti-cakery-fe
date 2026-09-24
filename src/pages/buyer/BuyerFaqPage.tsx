import { useState, useEffect } from 'react';
import { ChevronDown, MessageCircleQuestion } from 'lucide-react';
import { getAllFaqs, type FaqOut } from '@/api/faq';

export default function BuyerFaqPage() {
  const [faqs, setFaqs] = useState<FaqOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const loadFaqs = async () => {
    setLoading(true);
    setError(false);
    try {
      // only active FAQs for public Buyer page
      const data = await getAllFaqs(true);
      setFaqs(data);
      if (data.length > 0) {
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

  const toggleFaq = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#fffaf5] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#d85b30]/10 mb-6 text-[#d85b30]">
            <MessageCircleQuestion className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-black text-[#4b2417] sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-[#6f5448]">
            Find answers to common questions about Toti Cakery.
          </p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-6 w-3/4 rounded bg-gray-200"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <h3 className="text-lg font-bold text-[#4b2417] mb-2">
              Unable to load frequently asked questions right now.
            </h3>
            <p className="text-[#6f5448] mb-6">Please try again later.</p>
            <button
              onClick={loadFaqs}
              className="rounded-xl bg-[#d85b30] px-6 py-3 font-bold text-white hover:bg-[#c04e28] transition-colors"
            >
              Retry
            </button>
          </div>
        ) : faqs.length === 0 ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-lg text-[#6f5448]">
              No frequently asked questions are available right now.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition-all hover:shadow-md"
              >
                <button
                  onClick={() => toggleFaq(faq.id)}
                  className="flex w-full items-center justify-between p-6 text-left"
                  aria-expanded={openId === faq.id}
                >
                  <span className="text-lg font-bold text-[#4b2417]">
                    {faq.pertanyaan}
                  </span>
                  <ChevronDown
                    className={`h-5 w-5 text-[#d85b30] transition-transform duration-300 ${
                      openId === faq.id ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    openId === faq.id
                      ? 'grid-rows-[1fr] opacity-100'
                      : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-6 pt-0">
                      <p className="text-[#6f5448] leading-relaxed whitespace-pre-wrap">
                        {faq.jawaban}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
