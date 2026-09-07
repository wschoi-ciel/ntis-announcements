'use client';

import { useState, useEffect } from 'react';
import { Search, Calendar, Building2, ExternalLink } from 'lucide-react';

interface NoticeItem {
  ancmId?: string;       // 공고 ID
  ancmNm: string;        // 공고명
  deptNm?: string;       // 소관부처
  mngOrgNm?: string;     // 전문기관/관리기관
  rcptEndDt?: string;    // 접수종료일
  dtlUrl?: string;       // 상세 URL
}

export default function Home() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchNotices = async (query = '') => {
    setLoading(true);
    try {
      const res = await fetch(`/api/announcements?keyword=${encodeURIComponent(query)}`);
      const result = await res.json();
      
      // NTIS 응답 규격 구조에 맞게 매핑 (응답 바디 구조에 따라 item 경로 조정 필요)
      const items = result?.response?.body?.items?.item || [];
      setNotices(Array.isArray(items) ? items : [items]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchNotices(keyword);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">정부 부처 R&D 사업공고 모니터링</h1>
          <p className="text-sm text-slate-500">NTIS 통합 과제 공고 실시간 조회</p>
        </header>

        {/* 검색창 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              className="w-full pl-9 pr-4 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="사업명, 키워드 검색 (예: 자율주행, AI, 모빌리티)"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            검색
          </button>
        </form>

        {/* 리스트 렌더링 */}
        {loading ? (
          <div className="text-center py-20 text-slate-400">데이터를 불러오는 중입니다...</div>
        ) : (
          <div className="grid gap-4">
            {notices.map((item, idx) => (
              <div key={item.ancmId || idx} className="p-5 bg-white border rounded-xl shadow-sm hover:border-blue-300 transition">
                <div className="flex flex-wrap gap-2 text-xs font-semibold mb-2">
                  {item.deptNm && <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded">{item.deptNm}</span>}
                  {item.mngOrgNm && <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded">{item.mngOrgNm}</span>}
                </div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">{item.ancmNm}</h3>
                <div className="flex items-center justify-between text-sm text-slate-500 mt-4">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>접수 마감: {item.rcptEndDt || '공고문 참조'}</span>
                  </div>
                  {item.dtlUrl && (
                    <a
                      href={item.dtlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      상세보기 <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}