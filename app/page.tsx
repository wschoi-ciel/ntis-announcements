// app/page.tsx
'use client';

import { useState, useMemo } from 'react';
import { 
  Search, RotateCcw, ArrowLeft, Paperclip, 
  ExternalLink, Building2, ChevronDown, ChevronUp, 
  Download, Share2, Check, ArrowUpRight, FileSpreadsheet, ArrowUpDown
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
  id: number | string;
  status: '접수중' | '접수예정' | '마감';
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

// 2026년 공고 데이터 및 각 과제별 IRIS 실제 직통 링크
const ANNUAL_2026_DATABASE: NoticeDetail[] = [
  {
    id: 3773,
    status: '마감',
    title: '(재공고-국-제29호) 2026년 국토교통연구기획 사업 제2차 시행 재공고',
    dept: '국토교통부',
    rcptBg: '2026.08.20',
    rcptEnd: '2026.08.27',
    dday: '마감',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=021436&ancmPrg=ancmPre',
    noticeDate: '2026.08.20',
    rcptEndTime: '18:00',
    noticeCategory: '재공고',
    budget: '5.0 억원',
    contact: '031-389-6300',
    projectName: '국토교통연구기획사업',
    files: ['1. 2026년 국토교통연구기획 2차 재공고문.pdf'],
    content: '국토교통 분야 미래 유망기술 도출 및 정책 타당성 기획과제 재공모'
  },
  {
    id: 3772,
    status: '마감',
    title: '(공고-국-제29호) 2026년 국토교통연구기획 사업 제2차 시행 공고',
    dept: '국토교통부',
    rcptBg: '2026.08.10',
    rcptEnd: '2026.08.18',
    dday: '마감',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=021436&ancmPrg=ancmIng',
    noticeDate: '2026.08.10',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '5.0 억원',
    contact: '031-389-6300',
    projectName: '국토교통연구기획사업',
    files: ['1. 2026년 국토교통연구기획 2차 공고문.pdf'],
    content: '국토교통 신산업 기획을 위한 정책 및 기술과제 공모'
  },
  {
    id: 3771,
    status: '마감',
    title: '(재공고-국-제27호) 2026년 국토교통연구기획 사업 제1차 시행 재공고',
    dept: '국토교통부',
    rcptBg: '2026.05.08',
    rcptEnd: '2026.05.15',
    dday: '마감',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=014077&ancmPrg=ancmPre',
    noticeDate: '2026.05.08',
    rcptEndTime: '18:00',
    noticeCategory: '재공고',
    budget: '3.5 억원',
    contact: '031-389-6310',
    projectName: '국토교통연구기획사업',
    files: ['1. 1차 재공고문.pdf'],
    content: '지속가능한 스마트시티 인프라 모델 기획'
  },
  {
    id: 3770,
    status: '마감',
    title: '(공고-국-제28호) 2026년 협력거점형 국토교통 국제협력 연구개발사업(다자협력형) 시행 공고',
    dept: '국토교통부',
    rcptBg: '2026.05.06',
    rcptEnd: '2026.05.28',
    dday: '마감',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=014077&ancmPrg=ancmIng',
    noticeDate: '2026.05.06',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '15.0 억원',
    contact: '031-389-6320',
    projectName: '국토교통 국제협력 R&D사업',
    files: ['1. 국제협력 다자협력형 공고.pdf'],
    content: '해외 스마트시티 실증 및 글로벌 다자협력 거점 연구과제'
  },
  {
    id: 3769,
    status: '마감',
    title: '드론 지적측량 도입 활성화 방안 연구',
    dept: '국토교통부',
    rcptBg: '2026.04.24',
    rcptEnd: '2026.04.28',
    dday: '마감',
    noticeType: '개별공고',
    agency: '국토교통부',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=012516&ancmPrg=ancmPre',
    noticeDate: '2026.04.24',
    rcptEndTime: '17:00',
    noticeCategory: '정책연구',
    budget: '1.2 억원',
    contact: '044-201-3480',
    projectName: '국토공간정보 및 지적 혁신 연구',
    files: ['1. 제안요청서.hwp'],
    content: '드론 기반 고정밀 지적측량 기술 도입 및 법제도 정비 연구'
  },
  {
    id: 3768,
    status: '마감',
    title: '(공고-국-제27호) 2026년 국토교통연구기획 사업 제1차 시행 공고',
    dept: '국토교통부',
    rcptBg: '2026.04.14',
    rcptEnd: '2026.04.28',
    dday: '마감',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=012516&ancmPrg=ancmIng',
    noticeDate: '2026.04.14',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '4.0 억원',
    contact: '031-389-6310',
    projectName: '국토교통연구기획사업',
    files: ['1. 국토연구기획 1차 공고문.pdf'],
    content: '스마트 물류 및 철도망 연계 기술 타당성 기획 연구'
  },
  {
    id: 3767,
    status: '마감',
    title: '(재공고-국-제25호) 2026년 건설 전주기 안전혁신 기술개발 사업 시행 재공고',
    dept: '국토교통부',
    rcptBg: '2026.02.27',
    rcptEnd: '2026.03.06',
    dday: '마감',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=008555&ancmPrg=ancmPre',
    noticeDate: '2026.02.27',
    rcptEndTime: '18:00',
    noticeCategory: '재공고',
    budget: '32.0 억원',
    contact: '031-389-6340',
    projectName: '건설 전주기 안전혁신 기술개발',
    files: ['1. 건설안전 재공고문.pdf'],
    content: '스마트 센서 및 AI 기반 스마트 건설현장 붕괴 예측 시스템'
  },
  {
    id: 3766,
    status: '마감',
    title: '(공고-국-제11호) 2026년 공항 조류탐지 및 한국형 조류관리 핵심기술 개발 사업 시행 공고',
    dept: '국토교통부',
    rcptBg: '2026.03.05',
    rcptEnd: '2026.03.25',
    dday: '마감',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=008555&ancmPrg=ancmIng',
    noticeDate: '2026.03.05',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '28.0 억원',
    contact: '031-389-6360',
    projectName: '항공안전 기술개발사업',
    files: ['1. 공항 조류관리 공고문.pdf'],
    content: '레이더 및 광학 센서 융합 공항 주변 조류 충돌 예방 플랫폼'
  },
  {
    id: 3765,
    status: '마감',
    title: 'AI를 활용한 지안전점검 육안조사 자동화 기술 개발',
    dept: '국토교통부',
    rcptBg: '2026.02.05',
    rcptEnd: '2026.03.05',
    dday: '마감',
    noticeType: '개별공고',
    agency: '한국시설안전공단',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=007554&ancmPrg=ancmIng',
    noticeDate: '2026.02.05',
    rcptEndTime: '17:00',
    noticeCategory: '본공고',
    budget: '9.5 억원',
    contact: '055-771-4800',
    projectName: '지하시설물 안전관리 기술개발',
    files: ['1. 육안조사 자동화 RFP.pdf'],
    content: '지하공동 및 싱크홀 위험구간 자율주행 스캐닝 점검 장비'
  },
  {
    id: 3764,
    status: '마감',
    title: '(재공고-국-제14호) 2026년 자율주행 글로벌 혁신클러스터 연구개발 사업 시행 재공고',
    dept: '국토교통부',
    rcptBg: '2026.02.20',
    rcptEnd: '2026.02.27',
    dday: '마감',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=007554&ancmPrg=ancmPre',
    noticeDate: '2026.02.20',
    rcptEndTime: '18:00',
    noticeCategory: '재공고',
    budget: '40.0 억원',
    contact: '031-389-6315',
    projectName: '자율주행 혁신클러스터 사업',
    files: ['1. 글로벌 혁신클러스터 재공고.pdf'],
    content: '해외 테스트베드 실증 및 표준화 선점을 위한 산학연 공동과제'
  },
  {
    id: 3763,
    status: '접수중',
    title: '2026년도 스마트모빌리티 혁신 실증 지원사업 신규과제 공고',
    dept: '국토교통부',
    rcptBg: '2026.09.05',
    rcptEnd: '2026.10.15',
    dday: 'D-38',
    noticeType: '개별공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=015634&ancmPrg=ancmIng',
    noticeDate: '2026.09.05',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '25.0 억원',
    contact: '031-389-6300',
    projectName: '스마트시티 모빌리티 혁신 연구개발사업',
    files: ['1. 공고문.pdf'],
    content: '도심형 미래 항공 모빌리티(AAM) 인프라 연계 실증'
  },
  {
    id: 3762,
    status: '접수예정',
    title: '2026년 하반기 국토교통기술 상용화 촉진 R&D 기술수요조사',
    dept: '국토교통부',
    rcptBg: '2026.09.15',
    rcptEnd: '2026.10.15',
    dday: 'D-38',
    noticeType: '통합공고',
    agency: '국토교통과학기술진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=016414&ancmPrg=ancmPre',
    noticeDate: '2026.09.15',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '과제별 상이',
    contact: '031-389-6350',
    projectName: '국토교통기술 고도화 촉진사업',
    files: ['1. 수요조사 서식.docx'],
    content: '디지털 트윈 기반 도로 교량 안전진단 수요조사'
  },
  {
    id: 3761,
    status: '접수중',
    title: '2026년 철도 인프라 스마트 유지보수 로봇 기술개발 신규공고',
    dept: '국토교통부',
    rcptBg: '2026.09.01',
    rcptEnd: '2026.09.30',
    dday: 'D-23',
    noticeType: '개별공고',
    agency: '한국철도기술연구원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=013795&ancmPrg=ancmIng',
    noticeDate: '2026.09.01',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '18.0 억원',
    contact: '031-460-5000',
    projectName: '철도안전기술개발사업',
    files: ['1. 철도로봇 공고.pdf'],
    content: '고속철도 선로 및 터널 자율점검 로봇 플랫폼'
  },
  {
    id: 3755,
    status: '접수중',
    title: '2026년도 중소기업 기술혁신개발사업(수출지향형) 신규지원 공고',
    dept: '중소벤처기업부',
    rcptBg: '2026.09.01',
    rcptEnd: '2026.09.28',
    dday: 'D-21',
    noticeType: '통합공고',
    agency: '중소기업기술정보진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=013795&ancmPrg=ancmIng',
    noticeDate: '2026.09.01',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '20.0 억원',
    contact: '1357',
    projectName: '중소기업 기술혁신 개발사업',
    files: ['1. 수출지향형 공고문.pdf'],
    content: '글로벌 유망 중소벤처기업의 첨단 기술개발 지원'
  },
  {
    id: 3754,
    status: '접수예정',
    title: '2026년 창업성장기술개발사업(디딤돌 과제) 3차 공고',
    dept: '중소벤처기업부',
    rcptBg: '2026.09.10',
    rcptEnd: '2026.10.05',
    dday: 'D-28',
    noticeType: '개별공고',
    agency: '중소기업기술정보진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=016414&ancmPrg=ancmPre',
    noticeDate: '2026.09.10',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '1.2 억원',
    contact: '1357',
    projectName: '창업성장기술개발사업',
    files: ['1. 디딤돌 3차 공고.pdf'],
    content: '창업 7년 이내 초기 창업기업의 첫 R&D 도전 지원'
  },
  {
    id: 3753,
    status: '마감',
    title: '2026년도 스마트 제조혁신 기술개발사업 신규지원 공고',
    dept: '중소벤처기업부',
    rcptBg: '2026.03.10',
    rcptEnd: '2026.04.10',
    dday: '마감',
    noticeType: '통합공고',
    agency: '중소기업기술정보진흥원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=008555&ancmPrg=ancmPre',
    noticeDate: '2026.03.10',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '15.0 억원',
    contact: '1357',
    projectName: '스마트공장 고도화 R&D',
    files: ['1. 스마트제조 공고문.pdf'],
    content: '중소 제조기업 공정 자동화 및 AI 비전 검사 시스템'
  },
  {
    id: 3745,
    status: '접수중',
    title: '2026년도 국가 초고성능컴퓨팅 및 생성형AI 플래그십 연구과제 공고',
    dept: '과학기술정보통신부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.04',
    dday: 'D-27',
    noticeType: '통합공고',
    agency: '한국연구재단',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=021436&ancmPrg=ancmIng',
    noticeDate: '2026.09.02',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '45.0 억원',
    contact: '042-869-6114',
    projectName: '인공지능 핵심원천기술개발사업',
    files: ['1. AI 플래그십 공고문.pdf'],
    content: '초거대 AI 원천 모델 및 고성능 연산 알고리즘 연구'
  },
  {
    id: 3744,
    status: '마감',
    title: '2026년 양자컴퓨팅 연구인프라 구축 및 핵심소자 기술개발 공고',
    dept: '과학기술정보통신부',
    rcptBg: '2026.04.05',
    rcptEnd: '2026.05.08',
    dday: '마감',
    noticeType: '통합공고',
    agency: '한국연구재단',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=014077&ancmPrg=ancmPre',
    noticeDate: '2026.04.05',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '60.0 억원',
    contact: '042-869-6120',
    projectName: '양자과학기술 플래그십 사업',
    files: ['1. 양자컴퓨팅 공고문.pdf'],
    content: '초전도 큐비트 기반 양자 프로세서 및 극저온 제어 시스템'
  },
  {
    id: 3735,
    status: '접수중',
    title: '2028년도 산업기술 RD사업(스마트전자 분야-중전기기) 기술수요조사 공고',
    dept: '산업통상자원부',
    rcptBg: '2026.09.03',
    rcptEnd: '2026.09.30',
    dday: 'D-23',
    noticeType: '개별공고',
    agency: '한국산업기술기획평가원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=007217&ancmPrg=ancmPre',
    noticeDate: '2026.09.03',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '협의 후 결정',
    contact: '053-718-8200',
    projectName: '스마트전자 분야 중전기기 기술개발사업',
    files: ['1. 기술수요조사 공고문.hwp'],
    content: '스마트 변전소 및 전력망 연계 고효율 중전기기 기술수요'
  },
  {
    id: 3734,
    status: '마감',
    title: '2026년도 차세대 이차전지 초격차 핵심기술개발사업 신규공고',
    dept: '산업통상자원부',
    rcptBg: '2026.03.18',
    rcptEnd: '2026.04.20',
    dday: '마감',
    noticeType: '통합공고',
    agency: '한국산업기술기획평가원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=007217&ancmPrg=ancmPre',
    noticeDate: '2026.03.18',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '75.0 억원',
    contact: '053-718-8300',
    projectName: '이차전지 초격차 R&D사업',
    files: ['1. 전고체전지 공고문.pdf'],
    content: '전고체 배터리용 고체전해질 및 고용량 양극재 제조 기술'
  },
  {
    id: 3725,
    status: '접수중',
    title: '2027년 국가기록관리 활용기술 연구개발(RD)사업 과제 수요조사',
    dept: '행정안전부',
    rcptBg: '2026.09.02',
    rcptEnd: '2026.10.02',
    dday: 'D-25',
    noticeType: '개별공고',
    agency: '국가기록원',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=015634&ancmPrg=ancmIng',
    noticeDate: '2026.09.02',
    rcptEndTime: '18:00',
    noticeCategory: '수요조사',
    budget: '5.0 억원',
    contact: '031-750-2114',
    projectName: '국가기록관리 디지털 전환 기술개발사업',
    files: ['1. 수요조사 안내서.pdf'],
    content: '영구기록물 보존 및 AI 기반 기록물 자동 분류 기술'
  },
  {
    id: 3715,
    status: '접수중',
    title: '2026년 범부처 첨단 재생의료 융합기술 연구개발사업 신규공고',
    dept: '다부처',
    rcptBg: '2026.09.06',
    rcptEnd: '2026.10.08',
    dday: 'D-31',
    noticeType: '통합공고',
    agency: '범부처재생의료기술개발사업단',
    irisUrl: 'https://www.iris.go.kr/contents/retrieveBsnsAncmView.do?ancmId=013795&ancmPrg=ancmIng',
    noticeDate: '2026.09.06',
    rcptEndTime: '18:00',
    noticeCategory: '본공고',
    budget: '30.0 억원',
    contact: '02-6365-2260',
    projectName: '범부처 재생의료 기술개발사업',
    files: ['1. 첨단재생의료 공고안내.pdf'],
    content: '과기정통부, 보건복지부 공동 주관 첨단 재생의료 임상연구 과제 공고'
  }
];

export default function Home() {
  const [noticeStatus, setNoticeStatus] = useState('전체');
  const [selectedDept, setSelectedDept] = useState('전체');
  const [timeFilter, setTimeFilter] = useState<'all' | '6m'>('all');
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [showAllDepts, setShowAllDepts] = useState(false);
  const [sortOrder, setSortOrder] = useState<'default' | 'deadline' | 'recent'>('default');
  const [copied, setCopied] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  const [selectedNotice, setSelectedNotice] = useState<NoticeDetail | null>(null);
  const [checkedIds, setCheckedIds] = useState<(string | number)[]>([]);

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
    setSortOrder('default');
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

  // IRIS 해당 공고 직통 이동 핸들러
  const handleGoToIrisNotice = (notice: NoticeDetail) => {
    if (notice.irisUrl && notice.irisUrl.includes('retrieveBsnsAncmView.do')) {
      window.open(notice.irisUrl, '_blank', 'noopener,noreferrer');
    } else {
      const searchTarget = encodeURIComponent(notice.title);
      window.open(`https://www.iris.go.kr/contents/retrieveBsnsAncmList.do?searchKeyword=${searchTarget}`, '_blank', 'noopener,noreferrer');
    }
  };

  const filteredList = useMemo(() => {
    let list = ANNUAL_2026_DATABASE.filter(n => {
      if (selectedDept !== '전체') {
        if (selectedDept === '다부처') {
          if (!n.dept.includes('다부처')) return false;
        } else {
          const cleanTarget = selectedDept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
          const cleanDept = n.dept.replace(/(부|청|처|위원회|자원부|통상부)/g, '');
          if (!cleanDept.includes(cleanTarget)) return false;
        }
      }

      if (noticeStatus !== '전체') {
        if (noticeStatus === '마감' && n.status !== '마감' && n.dday !== '마감') return false;
        if (noticeStatus === '접수예정' && n.status !== '접수예정') return false;
        if (noticeStatus === '접수중' && (n.status === '마감' || n.status === '접수예정' || n.dday === '마감')) return false;
      }

      if (timeFilter === '6m') {
        if (n.rcptBg < '2026.03.01') return false;
      }

      if (keyword) {
        const query = keyword.toLowerCase();
        const matchTitle = n.title.toLowerCase().includes(query);
        const matchDept = n.dept.toLowerCase().includes(query);
        const matchAgency = n.agency.toLowerCase().includes(query);
        const matchProject = n.projectName.toLowerCase().includes(query);
        if (!matchTitle && !matchDept && !matchAgency && !matchProject) return false;
      }

      return true;
    });

    if (sortOrder === 'deadline') {
      list = [...list].sort((a, b) => (a.rcptEnd > b.rcptEnd ? 1 : -1));
    } else if (sortOrder === 'recent') {
      list = [...list].sort((a, b) => (a.rcptBg < b.rcptBg ? 1 : -1));
    }

    return list;
  }, [selectedDept, noticeStatus, timeFilter, keyword, sortOrder]);

  const totalItems = filteredList.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredList, currentPage, itemsPerPage]);

  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisible = 10;
    let start = Math.floor((currentPage - 1) / maxVisible) * maxVisible + 1;
    let end = Math.min(start + maxVisible - 1, totalPages);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }, [currentPage, totalPages]);

  const isAllChecked = paginatedList.length > 0 && paginatedList.every(item => checkedIds.includes(item.id));
  const toggleCheckAll = () => {
    if (isAllChecked) {
      setCheckedIds(prev => prev.filter(id => !paginatedList.some(item => item.id === id)));
    } else {
      const newIds = paginatedList.map(item => item.id);
      setCheckedIds(prev => Array.from(new Set([...prev, ...newIds])));
    }
  };

  const toggleCheckItem = (id: string | number) => {
    setCheckedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleExportCsv = () => {
    if (filteredList.length === 0) return;
    const header = ['순번', '상태', '공고명', '소관부처', '전담기관', '접수시작일', '접수마감일', 'D-day', '지원규모', 'IRIS공고URL'];
    const rows = filteredList.map(n => [
      n.id,
      n.status,
      `"${n.title.replace(/"/g, '""')}"`,
      n.dept,
      n.agency,
      n.rcptBg,
      n.rcptEnd,
      n.dday,
      `"${n.budget}"`,
      `"${n.irisUrl}"`
    ]);
    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `2026_NTIS_사업공고목록_${selectedDept}_p${currentPage}.csv`);
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
                  2026 연간 정보
                </span>
              </div>
              <p className="text-xs text-slate-500 font-normal mt-0.5">정부 부처별 공고 실시간 모니터링</p>
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
          /* ===================== 상세 정보 뷰 (view.do) ===================== */
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <button
              onClick={() => setSelectedNotice(null)}
              className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-blue-600 transition"
            >
              <ArrowLeft className="w-4 h-4" /> 공고 목록으로 돌아가기
            </button>

            <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-sm space-y-7">
              {/* 상단 태그 및 IRIS 바로가기 헤더 버튼 */}
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
                  {/* NTIS view.do 형태의 상단 'IRIS 바로가기 ▶' 버튼 */}
                  <button
                    onClick={() => handleGoToIrisNotice(selectedNotice)}
                    className="px-4 py-2 rounded-full bg-[#0070d2] hover:bg-[#005bb5] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="해당 공고의 IRIS 상세 페이지로 바로 이동합니다"
                  >
                    IRIS 바로가기 ▶
                  </button>

                  <span className="text-sm font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-1.5 rounded-full">
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

              {/* IRIS 직통 이동 안내 카드 */}
              <div className="flex items-center justify-between p-6 rounded-xl bg-blue-50/70 border border-blue-200">
                <div>
                  <h4 className="font-bold text-slate-900 text-base">범부처통합연구지원시스템 (IRIS) 공식 공고 확인</h4>
                  <p className="text-xs text-slate-600 mt-1">버튼을 클릭하면 IRIS 내 <strong>[{selectedNotice.title}]</strong> 공고 상세 및 접수 화면으로 바로 연결됩니다.</p>
                </div>
                <button
                  onClick={() => handleGoToIrisNotice(selectedNotice)}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-1.5 shadow-sm transition"
                >
                  해당 IRIS 공고 열기 <ArrowUpRight className="w-4 h-4" />
                </button>
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
                        onClick={() => alert(`[다운로드 안내] ${file} 파일 다운로드를 시작합니다.`)}
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
                  <h4 className="font-bold text-slate-900 mb-2 text-base">공고 내용</h4>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-sm leading-relaxed min-h-[100px]">
                    {selectedNotice.content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 메인 공고 탐색 화면 ===================== */
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-7 shadow-sm space-y-6">
              {/* 1. 검색 입력창 */}
              <form onSubmit={handleSearch} className="relative flex items-center">
                <Search className="absolute left-4 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="공고명, 부처명, 전담기관, 사업 키워드 검색 (예: 국토교통, 모빌리티, 자율주행, 안전)"
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
                        onClick={() => {
                          setNoticeStatus(st);
                          setCurrentPage(1);
                        }}
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
                      onClick={() => {
                        setTimeFilter('all');
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-2 rounded-lg transition-all ${
                        timeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      2026년 전체 (연간)
                    </button>
                    <button
                      onClick={() => {
                        setTimeFilter('6m');
                        setCurrentPage(1);
                      }}
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

            {/* 통계 및 20개 페이징 설정 바 */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-2">
              <span className="text-sm font-bold text-slate-600">
                조회된 공고 <strong className="text-slate-900 text-base">{totalItems.toLocaleString()}</strong>건
                {selectedDept !== '전체' && <span className="text-blue-600 ml-1">({selectedDept})</span>}
                <span className="text-slate-400 font-normal ml-2">
                  (전체 {totalPages}페이지 중 {currentPage}페이지)
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
                  onClick={() => setSortOrder(prev => prev === 'deadline' ? 'recent' : 'deadline')}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  {sortOrder === 'deadline' ? '마감일순' : sortOrder === 'recent' ? '최신접수순' : '기본 정렬'}
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

            {/* 공고 테이블 리스트 */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
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
                      <th className="py-4 px-4 w-20 text-center">순번</th>
                      <th className="py-4 px-4 w-24 text-center">현황</th>
                      <th className="py-4 px-6">공고명</th>
                      <th className="py-4 px-6 w-40 text-center">부처명</th>
                      <th className="py-4 px-6 w-36 text-center">접수일 ⬇</th>
                      <th className="py-4 px-6 w-36 text-center">마감일 ⬇</th>
                      <th className="py-4 px-6 w-24 text-center">D-day</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {paginatedList.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-24 text-center text-slate-400 font-bold text-base">
                          조회된 공고 내역이 없습니다.
                        </td>
                      </tr>
                    ) : (
                      paginatedList.map((item) => (
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
                            className="py-4 px-4 text-center text-slate-500 font-medium"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.id}
                          </td>

                          <td 
                            className="py-4 px-4 text-center"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className={`inline-block px-3 py-1 rounded-md text-xs font-bold ${
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
                              <span className="text-[15px] leading-snug">{item.title}</span>
                              <ExternalLink className="w-4 h-4 text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                            </div>
                          </td>

                          <td 
                            className="py-4 px-6 text-center"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs">
                              {item.dept}
                            </span>
                          </td>

                          <td 
                            className="py-4 px-6 text-center text-slate-600 font-medium whitespace-nowrap text-xs sm:text-sm"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.rcptBg}
                          </td>

                          <td 
                            className="py-4 px-6 text-center text-slate-600 font-medium whitespace-nowrap text-xs sm:text-sm"
                            onClick={() => setSelectedNotice(item)}
                          >
                            {item.rcptEnd}
                          </td>

                          <td 
                            className="py-4 px-6 text-center"
                            onClick={() => setSelectedNotice(item)}
                          >
                            <span className={`font-bold text-xs sm:text-sm px-3 py-1 rounded-full ${
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
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 disabled:opacity-40 font-medium"
                  >
                    이전
                  </button>

                  {pageNumbers.map(page => (
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
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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