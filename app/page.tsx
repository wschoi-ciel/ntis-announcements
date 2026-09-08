// app/page.tsx
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, RotateCcw, ArrowLeft, Paperclip, 
  ExternalLink, Building2, ChevronDown, ChevronUp, 
  Download, Share2, Check, FileSpreadsheet, ArrowUpDown, AlertCircle
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
  status: string;
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

  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);
  const [checkedIds, setCheckedIds] = useState<(string | number)[]>([]);

  // API 호출하여 필터링된 실제 공고만 로드
  const fetchLiveAnnouncements = useCallback(async () => {
    setLoading(true);
    setApiMessage('');
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
      
      if (data.success) {
        setNotices(data.items || []);
        // 필터에 따라 달라진 실제 건수를 그대로 반영
        setTotalItems(data.totalCount ?? (data.items ? data.items.length : 0));
        if (data.message) setApiMessage(data.message);
      } else {
        setNotices([]);
        setTotalItems(0);
        if (data.message) setApiMessage(data.message);
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setNotices([]);
      setTotalItems(0);
      setApiMessage('공고 데이터를 가져오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, selectedDept, noticeStatus, timeFilter, keyword]);

  useEffect(() => {
    fetchLiveAnnouncements();
  }, [fetchLiveAnnouncements]);

  // 필터 변경 시 1페이지부터 다시 조회
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

  // 마감일 역순 1순위, 등록일 역순 2순위 정렬
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
    const header = ['순번', '상태', '공고명', '소관부처', '전담기관', '접수시작일', '접수마감일', 'D-day', '지원규모'];
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
    link.setAttribute('download', `실제_공고목록_${selectedDept}_${noticeStatus}_p${currentPage}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 pb-28">
      {/* 1. 상단 글로벌 헤더 */}
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
                  실시간 API
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">정부 부처별 실시간 공고 모니터링 시스템</p>
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
                  <span className={`px-3.5 py-1.5 rounded-full text-sm font-bold ${
                    selectedNotice.status === '접수중' 
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                      : selectedNotice.status === '접수예정'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedNotice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* 해당 공고와 100% 일치하는 IRIS 직통 링크 */}
                  <a
                    href={selectedNotice.irisDirectUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="px-5 py-2.5 rounded-full bg-[#0070d2] hover:bg-[#005bb5] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="해당 공고의 IRIS 공식 상세 화면으로 이동합니다"
                  >
                    IRIS 바로가기 ▶
                  </a>

                  <span className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full whitespace-nowrap">
                    {selectedNotice.dday}
                  </span>
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
                  <span className="text-xs font-bold text-slate-500 block mb-1">지원 규모</span>
                  <span className="font-bold text-base text-blue-600">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">공고 기관</span>
                  <span className="font-bold text-slate-800">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">접수 기간</span>
                  <span className="font-bold text-slate-800">{selectedNotice.rcptBg} ~ {selectedNotice.rcptEnd}</span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">접수 마감 시간</span>
                  <span className="font-bold text-slate-800">{selectedNotice.rcptEndTime}</span>
                </div>
              </div>

              <div className="space-y-6 pt-2 border-t border-slate-100 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
                  <div><strong className="font-bold text-slate-900">사업명:</strong> {selectedNotice.projectName}</div>
                  <div><strong className="font-bold text-slate-900">문의처:</strong> {selectedNotice.contact}</div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-base">
                    <Paperclip className="w-4 h-4 text-slate-500" />
                    첨부파일 ({selectedNotice.files.length})
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {selectedNotice.files.map((file, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-sm transition cursor-pointer group"
                      >
                        <span className="text-sm font-bold text-slate-700 truncate pr-4 group-hover:text-blue-600">
                          {file}
                        </span>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-slate-900 text-base">공고 내용</h4>
                    <span className="text-xs text-red-500 font-bold">
                      ※ 자세한 내용은 <a href={selectedNotice.irisDirectUrl} target="_blank" rel="noreferrer noopener" className="underline text-blue-600 font-bold">공식 사업공고</a>에서 확인하시기 바랍니다.
                    </span>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed min-h-[100px]">
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
              {/* 1. 검색 입력창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="공고명, 부처명, 전문기관, 사업 키워드 검색"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-bold"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm"
                >
                  검색
                </button>
              </form>

              {/* 2. 상태 필터 & 기간 필터 */}
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

            {/* 통계 및 정렬 바: 필터 조건에 따라 동적으로 변하는 실제 건수 표시 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <span className="text-sm font-bold text-slate-600">
                조회된 실제 공고 <strong className="text-slate-900 text-base">{totalItems.toLocaleString()}</strong>건
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
                      <th className="py-4 px-3 w-20 text-center">순번</th>
                      <th className="py-4 px-3 w-24 text-center">현황</th>
                      <th className="py-4 px-6">공고명</th>
                      <th className="py-4 px-4 w-36 text-center">부처명</th>
                      <th className="py-4 px-4 w-32 text-center">접수일</th>
                      <th className="py-4 px-4 w-32 text-center text-blue-700">마감일 ⬇</th>
                      <th className="py-4 px-4 w-36 text-center">D-day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-slate-400 font-bold text-base">
                          실시간 공고 데이터를 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : sortedList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-slate-500 font-bold text-base">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-8 h-8 text-slate-400" />
                            <span>{apiMessage || '선택하신 조건에 해당하는 실제 공고가 없습니다.'}</span>
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
                            className="py-4 px-3 text-center text-slate-500 font-medium whitespace-nowrap"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.id}
                          </td>

                          <td 
                            className="py-4 px-3 text-center whitespace-nowrap"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${
                              item.status === '접수중'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === '접수예정'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}>
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
                            <span className={`inline-flex items-center justify-center min-w-[64px] font-bold text-xs sm:text-sm px-3 py-1 rounded-full whitespace-nowrap ${
                              item.dday === '마감'
                                ? 'text-slate-500 bg-slate-100 border border-slate-200'
                                : 'text-rose-600 bg-rose-50 border border-rose-200'
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

              {/* 페이지네이션 바 */}
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