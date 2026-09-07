// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RotateCcw, Calendar, ArrowLeft, Paperclip, 
  ExternalLink, Building2, Sparkles, ChevronDown, ChevronUp, 
  Download, Bookmark, Share2, Check, Clock, Layers, ArrowUpRight
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
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 font-sans selection:bg-indigo-500 selection:text-white relative overflow-x-hidden">
      {/* 앰비언트 배경 글로우 효과 */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[360px] bg-gradient-to-tr from-indigo-600/15 via-violet-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* 헤더 네비게이션 */}
      <header className="sticky top-0 z-40 bg-[#0b0f19]/80 backdrop-blur-xl border-b border-slate-800/80 transition-all">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-300">
              R
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white tracking-tight">국가R&D 허브</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 tracking-wider">
                NTIS LIVE
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedNotice ? (
              <button
                onClick={() => setSelectedNotice(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> 목록으로
              </button>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                실시간 연동중
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-10 pb-28">
        {selectedNotice ? (
          /* ===================== 상세 정보 뷰 (하이엔드 카드) ===================== */
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-indigo-400 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> 공고 탐색으로 돌아가기
            </button>

            <div className="bg-[#121826] rounded-3xl border border-slate-800/80 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-3xl pointer-events-none" />

              {/* 태그 바 */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {selectedNotice.dept}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-800 text-slate-300">
                    {selectedNotice.noticeType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedNotice.status === '접수중' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedNotice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1 rounded-full">
                    {selectedNotice.dday}
                  </span>
                  <button 
                    onClick={handleCopyLink}
                    className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="공고 링크 복사"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 공고 타이틀 */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight mb-8">
                {selectedNotice.title}
              </h2>

              {/* 핵심 메트릭 그리드 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 rounded-2xl bg-[#172033] border border-slate-800 mb-8">
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">지원 규모</span>
                  <span className="text-sm font-bold text-indigo-400">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">전담 기관</span>
                  <span className="text-sm font-medium text-slate-200">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">접수 마감</span>
                  <span className="text-sm font-medium text-slate-200">{selectedNotice.rcptEnd} ({selectedNotice.rcptEndTime})</span>
                </div>
                <div>
                  <span className="text-[11px] font-medium text-slate-400 block mb-1">담당 문의처</span>
                  <span className="text-sm font-medium text-slate-200">{selectedNotice.contact}</span>
                </div>
              </div>

              {/* 메인 CTA: IRIS 바로가기 */}
              <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-slate-900 border border-indigo-500/30 mb-8">
                <div>
                  <h4 className="font-bold text-white text-sm">범부처통합연구지원시스템(IRIS) 공식 접수</h4>
                  <p className="text-xs text-slate-400 mt-0.5">과제 신청, 서식 제출 및 공모 요강 원본 확인</p>
                </div>
                <a
                  href={selectedNotice.irisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-600/30 hover:scale-[1.02] transition"
                >
                  신청 페이지 열기 <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 세부 사업 및 첨부파일 */}
              <div className="space-y-6 pt-4 border-t border-slate-800">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">세부 사업명</h4>
                  <p className="text-sm text-slate-300 font-medium">{selectedNotice.projectName}</p>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                    첨부 서식 및 공고문 ({selectedNotice.files.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedNotice.files.map((f, i) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-3.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/40 transition cursor-pointer group"
                      >
                        <span className="text-xs text-slate-300 truncate pr-4 group-hover:text-indigo-300 font-medium">
                          {f}
                        </span>
                        <Download className="w-4 h-4 text-slate-500 group-hover:text-indigo-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">공고 요약</h4>
                  <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/60 text-xs text-slate-400 leading-relaxed min-h-[100px]">
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 메인 탐색 대시보드 ===================== */
          <div className="space-y-8">
            {/* 타이틀 히어로 영역 */}
            <div className="text-center max-w-2xl mx-auto space-y-3 pt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-indigo-400 text-xs font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                정부 R&D 통합 공고 인텔리전스
              </div>
              <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                지금 지원 가능한 국가 과제 탐색
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 font-normal">
                과학기술정보통신부, 산업통상부, 중기부 등 40여 개 부처의 R&D 지원사업을 한곳에서
              </p>
            </div>

            {/* 메인 컨트롤 카드: 검색 & 필터 */}
            <div className="bg-[#121826]/90 backdrop-blur-xl rounded-2xl border border-slate-800/90 p-5 sm:p-6 shadow-xl space-y-5">
              {/* 스마트 검색창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="사업명, 키워드 검색 (예: 이차전지, 인공지능, 로봇, 바이오)"
                  className="w-full pl-11 pr-28 py-3 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20"
                >
                  검색
                </button>
              </form>

              {/* 상태 스위치 & 리셋 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
                <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80">
                  {['전체', '접수중', '접수예정', '마감'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setNoticeStatus(st)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        noticeStatus === st
                          ? 'bg-indigo-600 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition font-medium"
                >
                  <RotateCcw className="w-3 h-3" /> 조건 초기화
                </button>
              </div>

              {/* 부처 캡슐 필터 */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>소관 부처</span>
                  </div>
                  <button
                    onClick={() => setShowAllDepts(!showAllDepts)}
                    className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    {showAllDepts ? '주요 부처만' : '전체 47개 부처'} 
                    {showAllDepts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(showAllDepts ? ALL_DEPTS : MAJOR_DEPTS).map((d) => (
                    <button
                      key={d}
                      onClick={() => handleDeptSelect(d)}
                      className={`px-3 py-1.5 rounded-xl text-xs transition-all font-medium ${
                        selectedDept === d
                          ? 'bg-white text-slate-900 font-bold shadow-md'
                          : 'bg-slate-900/70 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 리스트 헤더 메타정보 */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-400 font-medium">
                총 <strong className="text-white font-bold">{totalCount.toLocaleString()}</strong>개의 공고
              </span>
            </div>

            {/* 카드형 공고 테이블 */}
            <div className="bg-[#121826] rounded-2xl border border-slate-800/90 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 font-semibold">
                      <th className="py-3.5 px-6 w-24 text-center">상태</th>
                      <th className="py-3.5 px-4">사업 공고명</th>
                      <th className="py-3.5 px-4 w-36 text-center">소관 부처</th>
                      <th className="py-3.5 px-4 w-32 text-center">접수 기간</th>
                      <th className="py-3.5 px-6 w-24 text-center">마감일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-500 font-medium">
                          최신 공고 목록을 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-500 font-medium">
                          선택한 조건에 맞는 공고가 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedNotice(item)}
                          className="hover:bg-slate-800/40 cursor-pointer transition-all group"
                        >
                          {/* 상태 뱃지 */}
                          <td className="py-4 px-6 text-center">
                            <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              item.status === '접수중'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.status === '접수예정'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-slate-800 text-slate-500'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* 공고명 */}
                          <td className="py-4 px-4 font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-sm line-clamp-1">{item.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          {/* 부처 */}
                          <td className="py-4 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 font-medium text-[11px] border border-slate-800">
                              {item.dept}
                            </span>
                          </td>

                          {/* 접수 기간 */}
                          <td className="py-4 px-4 text-center text-slate-400 font-medium whitespace-nowrap text-[11px]">
                            {item.rcptBg} ~ {item.rcptEnd}
                          </td>

                          {/* D-day */}
                          <td className="py-4 px-6 text-center">
                            <span className={`font-bold text-xs px-2.5 py-0.5 rounded-full ${
                              item.dday === '마감'
                                ? 'text-slate-500 bg-slate-900'
                                : 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
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