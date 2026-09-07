// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RotateCcw, ArrowLeft, Paperclip, 
  ExternalLink, Building2, ChevronDown, ChevronUp, 
  Download, Share2, Check, ArrowUpRight, Sparkles
} from 'lucide-react';

// 요청하신 핵심 5대 주요 부처 정의
const KEY_DEPTS = [
  '전체', '다부처', '중소벤처기업부', '과학기술정보통신부', '산업통상부', '국토교통부', '행정안전부'
];

// 필요 시 펼쳐볼 수 있는 전체 부처 목록
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
  const [copied, setCopied] = useState(false);
  
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

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-28">
      {/* 상단 네비게이션 헤더 */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            {/* NTIS 스타일 심볼 로고 */}
            <div className="w-8 h-8 rounded-lg bg-[#004b93] flex items-center justify-center text-white font-black text-sm shadow-sm group-hover:bg-[#003870] transition">
              <span className="text-[#ff6b00] font-black mr-0.5">•</span>N
            </div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-slate-900 tracking-tight">국가R&D 통합공고</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                NTIS 연동
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedNotice ? (
              <button
                onClick={() => setSelectedNotice(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/70 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                실시간 업데이트
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        {selectedNotice ? (
          /* ===================== 밝은 톤 상세 뷰 ===================== */
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 공고 목록으로 돌아가기
            </button>

            <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-10 shadow-sm space-y-6">
              {/* 태그 바 */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
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
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-rose-600 bg-rose-50 border border-rose-200/60 px-3 py-1 rounded-full">
                    {selectedNotice.dday}
                  </span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-600 transition"
                    title="링크 복사"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 공고 타이틀 */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                {selectedNotice.title}
              </h2>

              {/* 핵심 요약 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100 text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">지원 규모</span>
                  <span className="font-bold text-blue-600">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">공고 기관</span>
                  <span className="font-semibold text-slate-800">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">접수 기간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptBg} ~ {selectedNotice.rcptEnd}</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block mb-1">접수 마감 시간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptEndTime}</span>
                </div>
              </div>

              {/* IRIS 신청 CTA 카드 */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/60">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">범부처통합연구지원시스템 (IRIS) 바로가기</h4>
                  <p className="text-xs text-slate-600 mt-0.5">과제 신청, 온라인 접수 및 첨부서식 원본 다운로드</p>
                </div>
                <a
                  href={selectedNotice.irisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:shadow transition"
                >
                  IRIS 접수 이동 <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 사업 세부정보 및 첨부파일 */}
              <div className="space-y-6 pt-2 border-t border-slate-100 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-700">
                  <div><strong className="font-bold text-slate-900">세부 사업명:</strong> {selectedNotice.projectName}</div>
                  <div><strong className="font-bold text-slate-900">문의처:</strong> {selectedNotice.contact}</div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    첨부파일 ({selectedNotice.files.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNotice.files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition cursor-pointer group"
                      >
                        <span className="text-xs font-medium text-slate-700 truncate pr-4 group-hover:text-blue-600">
                          {file}
                        </span>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">공고 내용</h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 leading-relaxed min-h-[100px]">
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 밝은 톤 메인 대시보드 ===================== */
          <div className="space-y-6">
            {/* 상단 컨트롤 카드 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-5">
              {/* 1. 검색창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="사업명, 키워드 검색 (예: 스마트제조, 이차전지, 바이오, AI)"
                  className="w-full pl-11 pr-24 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-sm"
                >
                  검색
                </button>
              </form>

              {/* 2. 상태 필터 & 초기화 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl">
                  {['전체', '접수중', '접수예정', '마감'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setNoticeStatus(st)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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

              {/* 3. 소관 부처 필터 (중기부, 과기부, 산업부, 국토부, 행안부 중심) */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>주요 소관 부처</span>
                  </div>
                  <button
                    onClick={() => setShowAllDepts(!showAllDepts)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline font-semibold"
                  >
                    {showAllDepts ? '주요 부처만 보기' : '전체 47개 부처 펼치기'} 
                    {showAllDepts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(showAllDepts ? ALL_DEPTS : KEY_DEPTS).map((dept) => {
                    const isSelected = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => handleDeptSelect(dept)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200/80 text-slate-700'
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 통계 헤더 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500">
                총 <strong className="text-slate-900 font-extrabold">{totalCount.toLocaleString()}</strong>건의 과제 공고
              </span>
            </div>

            {/* 깔끔한 화이트 카드형 테이블 */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold">
                      <th className="py-3.5 px-6 w-24 text-center">상태</th>
                      <th className="py-3.5 px-4">사업 공고명</th>
                      <th className="py-3.5 px-4 w-36 text-center">소관 부처</th>
                      <th className="py-3.5 px-4 w-36 text-center">접수 기간</th>
                      <th className="py-3.5 px-6 w-24 text-center">남은 기간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 font-medium">
                          과제 정보를 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 font-medium">
                          선택한 조건의 공고가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedNotice(item)}
                          className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                        >
                          {/* 상태 태그 */}
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              item.status === '접수중'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === '접수예정'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* 공고명 */}
                          <td className="py-4 px-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm line-clamp-1">{item.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          {/* 부처 */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                              {item.dept}
                            </span>
                          </td>

                          {/* 접수 기간 */}
                          <td className="py-4 px-4 text-center text-slate-500 font-medium whitespace-nowrap text-[11px]">
                            {item.rcptBg} ~ {item.rcptEnd}
                          </td>

                          {/* D-day */}
                          <td className="py-4 px-6 text-center">
                            <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                              item.dday === '마감'
                                ? 'text-slate-400 bg-slate-100'
                                : 'text-rose-600 bg-rose-50 border border-rose-100'
                            }`}>
                              {item.dday}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}