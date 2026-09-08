// app/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, RotateCcw, ArrowLeft, Paperclip, 
  ExternalLink, Building2, ChevronDown, ChevronUp, 
  Download, Share2, Check, FileSpreadsheet, ArrowUpDown, AlertCircle, ShieldAlert
} from 'lucide-react';

const KEY_DEPTS = [
  '전체', '다부처', '중소벤처기업부', '과학기술정보통신부', '산업통상자원부', '국토교통부', '행정안전부'
];

const ALL_DEPTS = [
  '전체', '다부처', '중소벤처기업부', '과학기술정보통신부', '산업통상자원부', '국토교통부', '행정안전부',
  '기후에너지환경부', '보건복지부', '교육부', '농림축산식품부', '해양수산부', '방위사업청', 
  '소방청', '식품의약품안전처', '기상청', '농촌진흥청', '산림청', '질병관리청', '특허청', '기타'
];

interface NoticeDetail {
  id: string | number;
  status: '접수중' | '접수예정' | '마감';
  title: string;
  dept: string;
  rcptBg: string;
  rcptEnd: string;
  dday: string;
  noticeType: string;
  agency: string;
  noticeDate: string;
  rcptEndTime: string;
  noticeCategory: string;
  budget: string;
  contact: string;
  projectName: string;
  files: string[];
  content: string;
  ntisUrl: string;
  irisDirectUrl: string;
}

export default function Home() {
  const [noticeStatus, setNoticeStatus] = useState<string>('전체');
  const [selectedDept, setSelectedDept] = useState<string>('전체');
  const [timeFilter, setTimeFilter] = useState<'all' | '6m'>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [showAllDepts, setShowAllDepts] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'deadline_desc' | 'recent_desc'>('deadline_desc');
  const [copied, setCopied] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(20);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [notices, setNotices] = useState<NoticeDetail[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [apiMessage, setApiMessage] = useState<string>('');
  const [isIpRestricted, setIsIpRestricted] = useState<boolean>(false);

  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);
  const [checkedIds, setCheckedIds] = useState<(string | number)[]>([]);

  // XML 파싱 헬퍼 함수
  const parseXmlResponse = (xmlText: string, page: number, size: number) => {
    const getXmlTag = (xml: string, tag: string): string => {
      const tagPattern = tag.replace(/\s+/g, '\\s+');
      const reg = new RegExp(`<${tagPattern}[^>]*>([\\s\\S]*?)<\\/${tagPattern}>`, 'i');
      const match = xml.match(reg);
      if (!match) return '';
      return match[1].replace(/<[^>]*>/g, '').trim();
    };

    const totalMatch = xmlText.match(/<TOTALHITS>(\d+)<\/TOTALHITS>/i) || 
                       xmlText.match(/<COLCOUNT[^>]*>(\d+)<\/COLCOUNT>/i);
    const apiTotalHits = totalMatch ? parseInt(totalMatch[1], 10) : 0;
    const hitMatches = xmlText.match(/<HIT[\s\S]*?<\/HIT>/gi) || [];

    const items: NoticeDetail[] = hitMatches.map((hitBlock, idx) => {
      const pjtId = getXmlTag(hitBlock, 'Project Number') || getXmlTag(hitBlock, 'ProjectNumber') || `${page}-${idx + 1}`;
      const titleRaw = getXmlTag(hitBlock, 'Korean') || getXmlTag(hitBlock, 'ProjectTitle') || '과제명 정보 없음';
      const cleanTitle = titleRaw.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
      const ministry = getXmlTag(hitBlock, 'Ministry') || getXmlTag(hitBlock, 'Name') || '과학기술정보통신부';
      const agency = getXmlTag(hitBlock, 'OrderAgency') || getXmlTag(hitBlock, 'ManageAgency') || '전문기관';
      const budgetProject = getXmlTag(hitBlock, 'BudgetProject') || getXmlTag(hitBlock, 'BusinessName') || cleanTitle;
      const manager = getXmlTag(hitBlock, 'Manager') || '연구책임자';
      const rawStart = getXmlTag(hitBlock, 'Start');
      const rawEnd = getXmlTag(hitBlock, 'End');
      const totalFundsRaw = getXmlTag(hitBlock, 'TotalFunds') || getXmlTag(hitBlock, 'GovernmentFunds');

      const bg = rawStart && rawStart.length >= 8 
        ? `${rawStart.substring(0, 4)}.${rawStart.substring(4, 6)}.${rawStart.substring(6, 8)}` : '2026.01.01';
      const end = rawEnd && rawEnd.length >= 8 
        ? `${rawEnd.substring(0, 4)}.${rawEnd.substring(4, 6)}.${rawEnd.substring(6, 8)}` : '2026.12.31';

      return {
        id: pjtId,
        status: '접수중',
        title: cleanTitle,
        dept: ministry,
        rcptBg: bg,
        rcptEnd: end,
        dday: '접수중',
        noticeType: '국가R&D과제',
        agency,
        noticeDate: bg,
        rcptEndTime: '18:00',
        noticeCategory: '본공고',
        budget: totalFundsRaw ? `${(Number(totalFundsRaw) / 100000000).toFixed(1)} 억원` : '공고문 참조',
        contact: manager,
        projectName: budgetProject,
        files: [`1. 과제요약서_${pjtId}.pdf`],
        content: getXmlTag(hitBlock, 'Abstract') || '세부 연구목표는 상세페이지를 참조하시기 바랍니다.',
        ntisUrl: `https://www.ntis.go.kr/project/pjtInfo.do?pjtId=${pjtId}`,
        irisDirectUrl: `https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${encodeURIComponent(cleanTitle)}`
      };
    });

    return { items, totalCount: apiTotalHits || items.length };
  };

  // 1. 서버 API 호출 $\rightarrow$ 2. IP 차단 시 클라이언트 직접 호출 모드 연계
  const fetchLiveAnnouncements = useCallback(async () => {
    setLoading(true);
    setApiMessage('');
    setIsIpRestricted(false);

    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        size: String(itemsPerPage),
        dept: selectedDept,
        status: noticeStatus,
        time: timeFilter,
        keyword: keyword
      });

      const res = await fetch(`/api/announcements?${params.toString()}`);
      const data = await res.json();
      
      if (data.success && data.items && data.items.length > 0) {
        setNotices(data.items);
        setTotalItems(data.totalCount || data.items.length);
        return;
      }

      // 서버 IP 차단 감지 시
      if (data.isIpBlocked && data.directUrl) {
        setIsIpRestricted(true);
        // 등록된 IP(사용자의 로컬 브라우저)에서 직접 호출 시도
        try {
          const directRes = await fetch(data.directUrl, { mode: 'cors' });
          const directText = await directRes.text();
          if (directText.includes('<HIT')) {
            const parsed = parseXmlResponse(directText, currentPage, itemsPerPage);
            setNotices(parsed.items);
            setTotalItems(parsed.totalCount);
            setIsIpRestricted(false);
            return;
          }
        } catch {
          // 브라우저 CORS 제한 시 안내 메시지 유지
        }
      }

      setNotices([]);
      setTotalItems(0);
      setApiMessage(data.message || '과제 데이터를 가져오지 못했습니다.');

    } catch (e) {
      console.error('Fetch error:', e);
      setNotices([]);
      setTotalItems(0);
      setApiMessage('네트워크 통신 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedDept, noticeStatus, timeFilter, keyword]);

  useEffect(() => {
    fetchLiveAnnouncements();
  }, [fetchLiveAnnouncements]);

  const handleStatusChange = (st: string) => {
    setNoticeStatus(st);
    setCurrentPage(1);
  };

  const handleTimeChange = (tf: 'all' | '6m') => {
    setTimeFilter(tf);
    setCurrentPage(1);
  };

  const handleDeptSelect = (dept: string) => {
    setSelectedDept(dept);
    setSelectedNotice(null);
    setCurrentPage(1);
  };

  const handleReset = () => {
    setNoticeStatus('전체');
    setSelectedDept('전체');
    setTimeFilter('all');
    setKeyword('');
    setSearchInput('');
    setSortOrder('deadline_desc');
    setSelectedNotice(null);
    setCheckedIds([]);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput.trim());
    setSelectedNotice(null);
    setCurrentPage(1);
  };

  const sortedList = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (sortOrder === 'deadline_desc') {
        if (b.rcptEnd !== a.rcptEnd) return b.rcptEnd.localeCompare(a.rcptEnd);
        return b.rcptBg.localeCompare(a.rcptBg);
      } else {
        if (b.rcptBg !== a.rcptBg) return b.rcptBg.localeCompare(a.rcptBg);
        return b.rcptEnd.localeCompare(a.rcptEnd);
      }
    });
  }, [notices, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const maxVisible = 10;
    const start = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
    const end = Math.min(start + maxVisible - 1, totalPages);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const isAllChecked = sortedList.length > 0 && sortedList.every((item) => checkedIds.includes(item.id));
  const toggleCheckAll = () => {
    if (isAllChecked) {
      setCheckedIds((prev) => prev.filter((id) => !sortedList.some((item) => item.id === id)));
    } else {
      const newIds = sortedList.map((item) => item.id);
      setCheckedIds((prev) => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const toggleCheckItem = (id: string | number) => {
    setCheckedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    if (sortedList.length === 0) return;
    const header = ['과제고유번호', '상태', '과제명', '소관부처', '전문기관', '연구시작일', '연구종료일', 'D-day', '연구비'];
    const rows = sortedList.map((n) => [
      n.id,
      n.status,
      `"${n.title.replace(/"/g, '""')}"`,
      n.dept,
      n.agency,
      n.rcptBg,
      n.rcptEnd,
      n.dday,
      `"${n.budget}"`
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `NTIS_실시간과제공고_${selectedDept}_${noticeStatus}_p${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-28">
      {/* 1. 상단 헤더 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#004b93] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              <span className="text-[#ff6b00] mr-0.5">•</span>N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xl text-slate-900 tracking-tight">국가R&D 통합공고</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  NTIS 공식 OpenAPI
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">정부 부처별 실시간 과제공고 모니터링 시스템</p>
            </div>
          </div>

          {selectedNotice && (
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 목록으로
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-6">
        {selectedNotice ? (
          /* ===================== 공고 상세 화면 ===================== */
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 공고 목록으로 돌아가기
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {selectedNotice.dept}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-slate-100 text-slate-700">
                    {selectedNotice.noticeType}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {selectedNotice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedNotice.irisDirectUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-4 py-2.5 rounded-full bg-[#0070d2] hover:bg-[#005bb5] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="해당 과제명으로 IRIS 공고를 검색합니다"
                  >
                    IRIS 공고 검색 ▶
                  </a>

                  <a
                    href={selectedNotice.ntisUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-4 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="NTIS 공식 과제 상세정보를 조회합니다"
                  >
                    NTIS 과제 상세 ▶
                  </a>

                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                    title="링크 복사"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-snug">
                {selectedNotice.title}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">연구비 규모</span>
                  <span className="font-bold text-base text-blue-600">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">과제관리 전문기관</span>
                  <span className="font-bold text-slate-800">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">연구 기간</span>
                  <span className="font-bold text-slate-800">{selectedNotice.rcptBg} ~ {selectedNotice.rcptEnd}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">과제 고유번호</span>
                  <span className="font-bold text-slate-800">{selectedNotice.id}</span>
                </div>
              </div>

              <div className="space-y-6 pt-2 border-t border-slate-100 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
                  <div><strong className="font-bold text-slate-900">예산 사업명:</strong> {selectedNotice.projectName}</div>
                  <div><strong className="font-bold text-slate-900">연구책임자:</strong> {selectedNotice.contact}</div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-base">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    첨부자료 및 링크
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    <a 
                      href={selectedNotice.ntisUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition cursor-pointer group"
                    >
                      <span className="text-sm font-bold text-slate-700 truncate pr-4 group-hover:text-blue-600">
                        NTIS 과제 상세원문 ({selectedNotice.id}) 바로가기
                      </span>
                      <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 text-base">연구개발 내용 및 요약</h4>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap">
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 메인 공고 목록 화면 ===================== */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-6">
              {/* 1. 검색창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="과제명, 부처명, 전문기관, 키워드 검색"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm"
                >
                  검색
                </button>
              </form>

              {/* 2. 상태 & 기간 필터 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                    {['전체', '접수중', '접수예정', '마감'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(st)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                          noticeStatus === st
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => handleTimeChange('all')}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        timeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      최대 2년치 (2025년 ~ 현재)
                    </button>
                    <button
                      onClick={() => handleTimeChange('6m')}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        timeFilter === '6m' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      최근 6개월
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" /> 조건 초기화
                </button>
              </div>

              {/* 3. 소관 부처 필터 */}
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between text-sm font-bold text-slate-700">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span>소관 부처 선택</span>
                    {selectedDept !== '전체' && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full ml-1">
                        선택: {selectedDept}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowAllDepts(!showAllDepts)}
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-bold"
                  >
                    {showAllDepts ? '5대 주요 부처만 보기' : '전체 부처 펼치기'} 
                    {showAllDepts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {(showAllDepts ? ALL_DEPTS : KEY_DEPTS).map((dept) => {
                    const isSelected = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => handleDeptSelect(dept)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {dept}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 통계 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <span className="text-sm font-bold text-slate-600">
                조회된 실제 과제공고 <strong className="text-slate-900 text-base">{totalItems.toLocaleString()}</strong>건
                {selectedDept !== '전체' && <span className="text-blue-600 ml-1">({selectedDept})</span>}
                {noticeStatus !== '전체' && <span className="text-emerald-600 ml-1">[{noticeStatus}]</span>}
                <span className="text-slate-400 font-normal ml-2">
                  (전체 {totalPages.toLocaleString()}페이지 중 {currentPage}페이지)
                </span>
              </span>

              <div className="flex items-center gap-2 text-xs font-bold">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                  <span className="text-slate-500 font-normal">표시 개수:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10 개</option>
                    <option value={20}>20 개</option>
                    <option value={50}>50 개</option>
                    <option value={100}>100 개</option>
                  </select>
                </div>

                <button
                  onClick={() => setSortOrder((prev) => (prev === 'deadline_desc' ? 'recent_desc' : 'deadline_desc'))}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition shadow-sm"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                  <span>{sortOrder === 'deadline_desc' ? '마감일 역순 (우선)' : '등록일 역순'}</span>
                </button>

                <button
                  onClick={handleExportCsv}
                  className="inline-flex items-center gap-1 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 transition shadow-sm"
                  title="현재 목록 엑셀(CSV) 저장"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  리스트 다운로드
                </button>
              </div>
            </div>

            {/* IP 차단 발생 시 친절한 가이드 배너 */}
            {isIpRestricted && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <strong>NTIS IP 보안 승인 안내:</strong> 발급받으신 인증키는 등록하신 IP(<code>1.217.108.124</code>)에서만 조회를 허용하도록 설정되어 있습니다. 
                  해외 클라우드(Vercel) 서버 배포 환경에서도 7만 건 전량을 상시 조회하시려면, NTIS 마이페이지에서 <strong>등록 IP를 추가/변경</strong>하시거나 공공데이터포털 일반 인증키를 사용하시면 즉시 상시 연동됩니다.
                </div>
              </div>
            )}

            {/* 공고 테이블 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse table-fixed">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold text-sm">
                      <th className="py-4 px-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={isAllChecked}
                          onChange={toggleCheckAll}
                          className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                        />
                      </th>
                      <th className="py-4 px-3 w-28 text-center">과제고유번호</th>
                      <th className="py-4 px-3 w-24 text-center">현황</th>
                      <th className="py-4 px-6">과제명</th>
                      <th className="py-4 px-4 w-36 text-center">부처명</th>
                      <th className="py-4 px-4 w-32 text-center">연구시작일</th>
                      <th className="py-4 px-4 w-32 text-center text-blue-700">종료일 ⬇</th>
                      <th className="py-4 px-4 w-36 text-center">D-day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-slate-400 font-bold text-base">
                          NTIS 실시간 과제공고를 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : sortedList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-slate-500 font-bold text-base">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-400" />
                            <span>{apiMessage || '선택하신 조건에 해당하는 실제 과제가 없습니다.'}</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      sortedList.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-blue-50/40 transition-colors group cursor-pointer"
                        >
                          <td 
                            className="py-4 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              checked={checkedIds.includes(item.id)}
                              onChange={() => toggleCheckItem(item.id)}
                              className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                            />
                          </td>

                          <td 
                            className="py-4 px-3 text-center text-slate-500 font-medium whitespace-nowrap text-xs"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.id}
                          </td>

                          <td 
                            className="py-4 px-3 text-center whitespace-nowrap"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className="inline-block px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {item.status}
                            </span>
                          </td>

                          <td 
                            className="py-4 px-6 font-bold text-slate-900 group-hover:text-blue-600 transition-colors"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[15px] leading-snug line-clamp-1">{item.title}</span>
                              <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          <td 
                            className="py-4 px-4 text-center whitespace-nowrap"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs whitespace-nowrap">
                              {item.dept}
                            </span>
                          </td>

                          <td 
                            className="py-4 px-4 text-center text-slate-600 font-medium whitespace-nowrap text-xs sm:text-sm"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.rcptBg}
                          </td>

                          <td 
                            className="py-4 px-4 text-center text-slate-800 font-bold whitespace-nowrap text-xs sm:text-sm"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.rcptEnd}
                          </td>

                          <td 
                            className="py-4 px-4 text-center whitespace-nowrap"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className="inline-flex items-center justify-center min-w-[64px] font-bold text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap text-slate-600 bg-slate-100 border border-slate-200">
                              {item.dday}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* 페이지네이션 */}
              {totalPages > 1 && (
                <div className="p-5 bg-white border-t border-slate-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm select-none">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-medium"
                  >
                    처음
                  </button>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-medium"
                  >
                    이전
                  </button>

                  {pageNumbers.map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[34px] h-[34px] px-2 rounded font-bold transition-colors ${
                        currentPage === page
                          ? 'bg-[#1e293b] text-white'
                          : 'border border-slate-200 text-slate-700 hover:bg-slate-100 bg-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-medium"
                  >
                    다음
                  </button>

                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-medium"
                  >
                    끝
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}