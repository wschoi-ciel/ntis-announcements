// app/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Search, RotateCcw, ArrowLeft, Paperclip, 
  ExternalLink, Building2, ChevronDown, ChevronUp, 
  Download, Share2, Check, ArrowUpRight
} from 'lucide-react';

// 5대 핵심 부처
const KEY_DEPTS = [
  '전체', '다부처', '중소벤처기업부', '과학기술정보통신부', '산업통상자원부', '국토교통부', '행정안전부'
];

const ALL_DEPTS = [
  '전체', '다부처', '중소벤처기업부', '과학기술정보통신부', '산업통상자원부', '국토교통부', '행정안전부',
  '보건복지부', '기후에너지환경부', '교육부', '농림축산식품부', '해양수산부', '방위사업청', 
  '소방청', '식품의약품안전처', '기상청', '농촌진흥청', '산림청', '질병관리청', '특허청', '기타'
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

// 부처별 매칭을 위한 표준 데이터베이스 (중기부, 과기부, 산업부, 국토부, 행안부 등)
const INITIAL_DATABASE: NoticeDetail[] = [
  // 1. 국토교통부 공고
  {
    id: 77120,
    status: '접수중',
    title: '2026년도 스마트모빌리티 혁신 실증 지원사업 신규과제 공고',
    dept: '국토교통부',
    rcptBg: '2026.09.05',
    rcptEnd: '2026.10.15',
    dday: 'D-38',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.05',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '25.0 억원',
    contact: '031-389-6300',
    projectName: '스마트시티 모빌리티 혁신 연구개발사업',
    files: ['1. [공고문] 2026년 스마트모빌리티 지원사업.pdf', '2. 연구개발계획서 양식.hwp'],
    content: '자율주행 및 미래 항공 모빌리티(AAM) 인프라 연계를 위한 도시 실증 과제를 공모합니다.'
  },
  {
    id: 77119,
    status: '접수예정',
    title: '2027년 국토교통기술 상용화 촉진 R&D 기술수요조사',
    dept: '국토교통부',
    rcptBg: '2026.09.15',
    rcptEnd: '2026.10.15',
    dday: 'D-38',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.15',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '과제별 상이',
    contact: '031-389-6350',
    projectName: '국토교통기술 고도화 촉진사업',
    files: ['1. 기술수요조사서 서식.docx'],
    content: '디지털 트윈 기반 도로 교량 안전진단 및 스마트 인프라 기술 수요를 수렴합니다.'
  },

  // 2. 중소벤처기업부 공고
  {
    id: 77118,
    status: '접수중',
    title: '2026년도 중소기업 기술혁신개발사업(수출지향형) 신규지원 공고',
    dept: '중소벤처기업부',
    rcptBg: '2026.09.01',
    rcptEnd: '2026.09.28',
    dday: 'D-21',
    noticeType: '통합공고',
    agency: '중소기업기술정보진흥원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.01',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '20.0 억원',
    contact: '1357',
    projectName: '중소기업 기술혁신 개발사업',
    files: ['1. 2026년도 수출지향형 공고문.pdf', '2. 과제신청서식.zip'],
    content: '글로벌 진출 역량을 보유한 중소벤처기업의 첨단 기술개발을 집중 지원합니다.'
  },
  {
    id: 77117,
    status: '접수예정',
    title: '2026년 창업성장기술개발사업(디딤돌 과제) 3차 공고',
    dept: '중소벤처기업부',
    rcptBg: '2026.09.10',
    rcptEnd: '2026.10.05',
    dday: 'D-28',
    noticeType: '개별공고',
    agency: '중소기업기술정보진흥원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.10',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '1.2 억원',
    contact: '1357',
    projectName: '창업성장기술개발사업(창업 7년 이내)',
    files: ['1. 디딤돌 3차 사업공고.pdf'],
    content: '초기 창업기업의 첫 R&D 도전 및 시장 안착을 지원하기 위한 과제 공모입니다.'
  },

  // 3. 과학기술정보통신부 공고
  {
    id: 77115,
    status: '접수중',
    title: '2026년도 국가 초고성능컴퓨팅 및 생성형AI 플래그십 연구과제 공고',
    dept: '과학기술정보통신부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.04',
    dday: 'D-27',
    noticeType: '통합공고',
    agency: '한국연구재단',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.02',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '45.0 억원',
    contact: '042-869-6114',
    projectName: '인공지능 핵심원천기술개발사업',
    files: ['1. 공고지침서 및 RFP.pdf', '2. 연구개발계획서 양식.hwp'],
    content: '차세대 고신뢰성 거대인공지능 원천 알고리즘 개발 및 GPU 가속 연구를 지원합니다.'
  },

  // 4. 산업통상자원부 공고
  {
    id: 77105,
    status: '접수중',
    title: '2028년도 산업기술 RD사업(스마트전자 분야-중전기기) 기술수요조사 공고',
    dept: '산업통상자원부',
    rcptBg: '2026.09.03',
    rcptEnd: '2026.09.30',
    dday: 'D-23',
    noticeType: '개별공고',
    agency: '한국산업기술기획평가원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.03',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '협의 후 결정',
    contact: '053-718-8200',
    projectName: '스마트전자 분야 중전기기 기술개발사업',
    files: ['1. 기술수요조사 공고문.hwp'],
    content: '스마트 변전소 및 분산 전원망 연계 고효율 중전기기 기술개발 수요조사'
  },
  {
    id: 77102,
    status: '접수중',
    title: '2027년도 자원분야 RD사업 통합기술수요조사 공고',
    dept: '산업통상자원부',
    rcptBg: '2026.09.04',
    rcptEnd: '2026.09.14',
    dday: 'D -7',
    noticeType: '개별공고',
    agency: '한국에너지기술평가원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.04',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '과제별 상이',
    contact: '02-3469-8400',
    projectName: '자원개발 및 공급망 안정화 R&D',
    files: ['1. 자원분야 기술수요조사 공고문.hwp'],
    content: '핵심 광물 정제련 및 자원 순환 공정 기술수요조사'
  },

  // 5. 행정안전부 공고
  {
    id: 77104,
    status: '접수중',
    title: '2027년 국가기록관리 활용기술 연구개발(RD)사업 과제 수요조사',
    dept: '행정안전부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.02',
    dday: 'D-25',
    noticeType: '개별공고',
    agency: '국가기록원',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.02',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '5.0 억원',
    contact: '031-750-2114',
    projectName: '국가기록관리 디지털 전환 기술개발사업',
    files: ['1. 수요조사 안내서.pdf'],
    content: '영구기록물 보존 및 AI 기반 기록물 자동 분류 색인 기술'
  },

  // 6. 다부처 공고
  {
    id: 77110,
    status: '접수중',
    title: '2026년 범부처 첨단 재생의료 융합기술 연구개발사업 신규공고',
    dept: '다부처',
    rcptBg: '2026.09.06',
    rcptEnd: '2026.10.08',
    dday: 'D-31',
    noticeType: '통합공고',
    agency: '범부처재생의료기술개발사업단',
    irisUrl: 'https://www.iris.go.kr',
    noticeDate: '2026.09.06',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '30.0 억원',
    contact: '02-6365-2260',
    projectName: '범부처 재생의료 기술개발사업',
    files: ['1. 첨단재생의료 공고안내.pdf'],
    content: '과기정통부, 복지부 공동 주관 첨단 재생의료 임상연구 과제 공고'
  }
];

export default function Home() {
  const [noticeStatus, setNoticeStatus] = useState('전체');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [keyword, setKeyword] = useState('');
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [notices, setNotices] = useState<NoticeDetail[]>(INITIAL_DATABASE);
  const [loading, setLoading] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);

  // API 데이터 호출
  const loadNotices = useCallback(async (kw = keyword, dept = selectedDept) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append('keyword', kw);
      if (dept && dept !== '전체') query.append('dept', dept);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        setNotices(data.items);
      } else {
        setNotices(INITIAL_DATABASE);
      }
    } catch {
      setNotices(INITIAL_DATABASE);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedDept]);

  useEffect(() => {
    loadNotices('', '전체');
  }, [loadNotices]);

  // 부처 선택 핸들러 (선택 즉시 필터 반영)
  const handleDeptSelect = (dept: string) => {
    setSelectedDept(dept);
    setSelectedNotice(null);
  };

  const handleReset = () => {
    setNoticeStatus('전체');
    setSelectedDept('전체');
    setKeyword('');
    setSelectedNotice(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedNotice(null);
  };

  // 핵심: 부처 필터링 & 검색 필터링 기준 보정
  const filteredList = useMemo(() => {
    return notices.filter(n => {
      // 1. 부처 필터링 (완전/부분 일치 처리)
      if (selectedDept !== '전체') {
        if (selectedDept === '다부처') {
          if (!n.dept.includes('다부처')) return false;
        } else {
          // '산업통상자원부' - '산업통상부' 호환 처리
          const targetDept = selectedDept.replace('자원부', '').replace('통상부', '');
          const noticeDept = n.dept.replace('자원부', '').replace('통상부', '');
          if (!noticeDept.includes(targetDept)) return false;
        }
      }

      // 2. 상태 필터링
      if (noticeStatus !== '전체') {
        if (noticeStatus === '마감' && (n.status !== '마감' && n.dday !== '마감')) return false;
        if (noticeStatus === '접수예정' && n.status !== '접수예정') return false;
        if (noticeStatus === '접수중' && (n.status === '마감' || n.status === '접수예정' || n.dday === '마감')) return false;
      }

      // 3. 키워드 필터링
      if (keyword.trim()) {
        const query = keyword.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(query);
        const matchDept = n.dept.toLowerCase().includes(query);
        if (!matchTitle && !matchDept) return false;
      }

      return true;
    });
  }, [notices, selectedDept, noticeStatus, keyword]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans pb-28">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-6 h-18 py-3.5 flex items-center justify-between">
          <div 
            onClick={() => setSelectedNotice(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#004b93] flex items-center justify-center text-white font-black text-lg shadow-sm">
              <span className="text-[#ff6b00] font-black mr-0.5">•</span>N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl text-slate-900 tracking-tight">국가R&D 통합공고</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  NTIS
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">정부 부처별 공고 실시간 모니터링</p>
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
          /* ===================== 상세 정보 화면 ===================== */
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 공고 목록으로 돌아가기
            </button>

            <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-7">
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
                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedNotice.status}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full">
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

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                {selectedNotice.title}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">지원 규모</span>
                  <span className="font-extrabold text-base text-blue-600">{selectedNotice.budget}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">공고 기관</span>
                  <span className="font-bold text-slate-800">{selectedNotice.agency}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">접수 기간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptBg} ~ {selectedNotice.rcptEnd}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-400 block mb-1">접수 마감 시간</span>
                  <span className="font-medium text-slate-800">{selectedNotice.rcptEndTime}</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-6 rounded-2xl bg-blue-50/70 border border-blue-200/80">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">범부처통합연구지원시스템 (IRIS) 바로가기</h4>
                  <p className="text-xs text-slate-600 mt-1">과제 신청, 온라인 접수 및 첨부서식 원본 다운로드</p>
                </div>
                <a
                  href={selectedNotice.irisUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  IRIS 접수 이동 <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-6 pt-2 border-t border-slate-100 text-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-slate-800">
                  <div><strong className="font-bold text-slate-900">세부 사업명:</strong> {selectedNotice.projectName}</div>
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
                        <span className="text-sm font-medium text-slate-700 truncate pr-4 group-hover:text-blue-600">
                          {file}
                        </span>
                        <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 mb-2 text-base">공고 내용</h4>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed min-h-[100px]">
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 메인 목록 화면 ===================== */
          <div className="space-y-6">
            {/* 상단 검색 & 필터 카드 */}
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-6">
              {/* 1. 검색창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="사업명, 키워드 검색 (예: 스마트모빌리티, 혁신개발, 디딤돌, AI)"
                  className="w-full pl-12 pr-28 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition font-medium"
                />
                <button
                  type="submit"
                  className="absolute right-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-sm"
                >
                  검색
                </button>
              </form>

              {/* 2. 상태 뱃지 & 초기화 */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl">
                  {['전체', '접수중', '접수예정', '마감'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setNoticeStatus(st)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" /> 조건 초기화
                </button>
              </div>

              {/* 3. 소관 부처 필터 (선택 즉시 해당 부처만 정확히 필터링) */}
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

                {/* 부처 칩 버튼 (글자 크기 14px로 가독성 향상) */}
                <div className="flex flex-wrap gap-2.5">
                  {(showAllDepts ? ALL_DEPTS : KEY_DEPTS).map((dept) => {
                    const isSelected = selectedDept === dept;
                    return (
                      <button
                        key={dept}
                        onClick={() => handleDeptSelect(dept)}
                        className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-sm ${
                          isSelected
                            ? 'bg-slate-900 text-white shadow-md scale-[1.02]'
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
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-semibold text-slate-600">
                조회된 공고 <strong className="text-slate-900 font-extrabold text-base">{filteredList.length}</strong>건
                {selectedDept !== '전체' && <span className="text-blue-600 ml-1">({selectedDept})</span>}
              </span>
            </div>

            {/* 메인 리스트 테이블 (시원시원한 폰트와 간격) */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold text-sm">
                      <th className="py-4 px-6 w-28 text-center">상태</th>
                      <th className="py-4 px-6">사업 공고명</th>
                      <th className="py-4 px-6 w-44 text-center">소관 부처</th>
                      <th className="py-4 px-6 w-44 text-center">접수 기간</th>
                      <th className="py-4 px-6 w-28 text-center">남은 기간</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 font-medium text-base">
                          과제 정보를 불러오는 중입니다...
                        </td>
                      </tr>
                    ) : filteredList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-24 text-center text-slate-400 font-medium text-base">
                          선택하신 <span className="font-bold text-slate-700">[{selectedDept}]</span> 부처의 공고 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      filteredList.map((item) => (
                        <tr
                          key={item.id}
                          onClick={() => setSelectedNotice(item)}
                          className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                        >
                          {/* 상태 뱃지 (가독성 높은 폰트) */}
                          <td className="py-5 px-6 text-center">
                            <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                              item.status === '접수중'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : item.status === '접수예정'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : 'bg-slate-100 text-slate-400'
                            }`}>
                              {item.status}
                            </span>
                          </td>

                          {/* 공고명 (글자 크기 15~16px 로 확장하여 선명하게 노출) */}
                          <td className="py-5 px-6 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            <div className="flex items-center justify-between gap-3">
                              <span className="text-[15px] sm:text-base leading-snug">{item.title}</span>
                              <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          {/* 소관 부처 */}
                          <td className="py-5 px-6 text-center">
                            <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                              {item.dept}
                            </span>
                          </td>

                          {/* 접수 기간 */}
                          <td className="py-5 px-6 text-center text-slate-600 font-medium whitespace-nowrap text-xs sm:text-sm">
                            {item.rcptBg} ~ {item.rcptEnd}
                          </td>

                          {/* D-day */}
                          <td className="py-5 px-6 text-center">
                            <span className={`font-black text-xs sm:text-sm px-3 py-1 rounded-full ${
                              item.dday === '마감'
                                ? 'text-slate-400 bg-slate-100'
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
            </div>
          </div>
        )}
      </main>
    </div>
  );
}