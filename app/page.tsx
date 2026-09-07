// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RotateCcw, Calendar, ArrowLeft, Paperclip, 
  ExternalLink, Building2, Clock, Sparkles, Filter, ChevronDown, ChevronUp, Download
} from 'lucide-react';

const MAJOR_DEPTS = [
  '전체', '다부처', '과학기술정보통신부', '산업통상부', '중소벤처기업부', 
  '기후에너지환경부', '보건복지부', '교육부', '국토교통부', '행정안전부'
];

const ALL_DEPTS = [
  '개인정보보호위원회', '경찰청', '고용노동부', '고준위방사성폐기물관리위원회', '공정거래위원회', '과학기술정보통신부', '교육부', '국가데이터처',
  '국가보훈부', '국가유산청', '국무조정실', '국방부', '국토교통부', '국회', '기상청', '기획예산처', '기획재정부', '기후에너지환경부',
  '농림축산식품부', '농촌진흥청', '대통령경호처', '대통령비서실', '문화체육관광부', '방송미디어통신위원회', '방위사업청', '법무부', '법제처',
  '보건복지부', '산림청', '산업통상부', '성평등가족부', '소방청', '식품의약품안전처', '외교부', '우주항공청', '원자력안전위원회', '재정경제부',
  '중소벤처기업부', '지식재산처', '질병관리청', '통일부', '해양경찰청', '해양수산부', '행정안전부', '다부처', '기타'
];

interface NoticeDetail {
  id: number | string;
  status: string;
  title: string;
  dept: string;
  rcptBg: string;
  rcptEnd: string;
  dday: string;
  noticeType: string;
  agency: string;
  irisUrl: string;
  noticeDate: string;
  rcptEndTime: string;
  noticeCategory: string;
  budget: string;
  contact: string;
  projectName: string;
  files: string[];
  content: string;
}

export default function Home() {
  const [noticeStatus, setNoticeStatus] = useState('전체');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [showAllDepts, setShowAllDepts] = useState(false);
  
  const [notices, setNotices] = useState<NoticeDetail[]>([]);
  const [totalCount, setTotalCount] = useState<number>(77106);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);

  const loadNotices = useCallback(async (kw = keyword, dept = selectedDept) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append('keyword', kw);
      if (dept && dept !== '전체') query.append('dept', dept);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      const data = await res.json();
      setNotices(data.items || []);
      setTotalCount(data.totalCount || 77106);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedDept]);

  useEffect(() => {
    loadNotices('', '전체');
  }, [loadNotices]);

  const handleDeptSelect = (dept: string) => {
    setSelectedDept(dept);
    setSelectedNotice(null);
    loadNotices(keyword, dept);
  };

  const handleReset = () => {
    setNoticeStatus('전체');
    setSelectedDept('전체');
    setKeyword('');
    setSelectedNotice(null);
    loadNotices('', '전체');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedNotice(null);
    loadNotices(keyword, selectedDept);
  };

  const filteredList = useMemo(() => {
    return notices.filter(n => {
      if (noticeStatus === '전체') return true;
      if (noticeStatus === '마감') return n.status === '마감' || n.dday === '마감';
      if (noticeStatus === '접수예정') return n.status === '접수예정';
      if (noticeStatus === '접수중') return n.status === '접수중' || (!n.status.includes('예정') && n.dday !== '마감');
      return true;
    });
  }, [notices, noticeStatus]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 antialiased pb-24">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">국가R&D 통합공고</span>
              <span className="ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                NTIS LIVE
              </span>
            </div>
          </div>

          {selectedNotice && (
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 목록으로
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        {selectedNotice ? (
          /* =================== 모던 상세 화면 =================== */
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 전체 공고 목록으로 돌아가기
            </button>

            {/* 카드 헤더 */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                  {selectedNotice.dept}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {selectedNotice.noticeType}
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedNotice.status === '접수중' 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  {selectedNotice.status}
                </span>
                <span className="ml-auto font-black text-rose-600 text-sm bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                  {selectedNotice.dday}
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pt-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                  {selectedNotice.title}
                </h2>
                <a
                  href={selectedNotice.irisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg hover:shadow-blue-500/30 transition whitespace-nowrap"
                >
                  IRIS 공고 신청 바로가기 <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {/* 핵심 요약 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">공고기관</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">지원 규모</span>
                  <span className="font-bold text-blue-600">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">접수 기간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptBg} ~ {selectedNotice.rcptEnd}</span>
                </div>
                <div>
                  <span className="block text-xs font-medium text-slate-400 mb-1">접수 마감 시간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptEndTime}</span>
                </div>
              </div>

              {/* 문의 및 세부 안내 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div><strong className="text-slate-900 font-semibold">사업명:</strong> {selectedNotice.projectName}</div>
                <div><strong className="text-slate-900 font-semibold">문의처:</strong> {selectedNotice.contact}</div>
              </div>

              {/* 첨부파일 다운로드 카드 */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Paperclip className="w-4 h-4 text-slate-500" />
                  <span>첨부파일 ({selectedNotice.files.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {selectedNotice.files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-sm transition cursor-pointer group"
                    >
                      <span className="text-xs font-medium text-slate-700 truncate pr-2 group-hover:text-blue-600">
                        {file}
                      </span>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* 공고 본문 */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">공고 내용</h3>
                <div className="p-6 rounded-xl bg-slate-50/70 border border-slate-100 text-sm text-slate-600 leading-relaxed min-h-[140px]">
                  {selectedNotice.content}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =================== 모던 메인 목록 =================== */
          <>
            {/* 상단 검색 & 필터 카드 */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.03)] space-y-6">
              {/* 1. 키워드 검색창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="사업명, 키워드(예: 인공지능, 이차전지, 바이오, 친환경)로 실시간 과제를 찾아보세요"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition outline-none"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-sm"
                >
                  검색
                </button>
              </form>

              {/* 2. 공고 상태 탭 뱃지 */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                  {['전체', '접수중', '접수예정', '마감'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setNoticeStatus(st)}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        noticeStatus === st
                          ? 'bg-white text-blue-600 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> 조건 초기화
                </button>
              </div>

              {/* 3. 소관 부처 필터 칩 */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>소관 부처별 모아보기</span>
                  </div>
                  <button
                    onClick={() => setShowAllDepts(!showAllDepts)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    {showAllDepts ? '주요 부처만 보기' : '전체 부처 펼치기'} 
                    {showAllDepts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(showAllDepts ? ALL_DEPTS : MAJOR_DEPTS).map((dept) => (
                    <button
                      key={dept}
                      onClick={() => handleDeptSelect(dept)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        selectedDept === dept
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 hover:bg-slate-200/70 text-slate-600'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 결과 건수 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-semibold text-slate-600">
                총 <strong className="text-slate-900 font-extrabold">{totalCount.toLocaleString()}</strong>건의 과제 공고
              </span>
            </div>

            {/* 메인 리스트 테이블 (모던 카드형 테이블) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
                      <th className="py-3.5 px-5 w-24 text-center">상태</th>
                      <th className="py-3.5 px-4">공고명</th>
                      <th className="py-3.5 px-4 w-40 text-center">소관 부처</th>
                      <th className="py-3.5 px-4 w-32 text-center">접수 기간</th>
                      <th className="py-3.5 px-4 w-24 text-center">남은 기간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                          과제 정보를 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-slate-400 font-medium">
                          조건에 부합하는 공고가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((notice) => (
                        <tr 
                          key={notice.id}
                          onClick={() => setSelectedNotice(notice)}
                          className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        >
                          {/* 상태 태그 */}
                          <td className="py-4 px-5 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md font-bold text-[11px] ${
                              notice.status === '접수중'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : notice.status === '접수예정'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200/80'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {notice.status}
                            </span>
                          </td>

                          {/* 공고명 */}
                          <td className="py-4 px-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-sm line-clamp-1">{notice.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          {/* 부처 */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium text-[11px]">
                              {notice.dept}
                            </span>
                          </td>

                          {/* 접수 기간 */}
                          <td className="py-4 px-4 text-center text-slate-500 font-medium whitespace-nowrap">
                            {notice.rcptBg} ~ {notice.rcptEnd}
                          </td>

                          {/* D-day */}
                          <td className="py-4 px-4 text-center">
                            <span className={`font-black text-xs px-2 py-0.5 rounded-full ${
                              notice.dday === '마감'
                                ? 'text-slate-400 bg-slate-100'
                                : 'text-rose-600 bg-rose-50 border border-rose-100'
                            }`}>
                              {notice.dday}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}