// API 호출 함수
  const fetchOpenApiData = useCallback(async (kw = keyword, dept = selectedDept) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (kw) query.append('keyword', kw);
      if (dept && dept !== '전체') query.append('dept', dept);

      const res = await fetch(`/api/announcements?${query.toString()}`);
      if (!res.ok) throw new Error('Network response not ok');

      const data = await res.json();
      setNotices(data.items || []);
      setTotalCount(data.totalCount || (data.items ? data.items.length : 0));
    } catch (err) {
      console.warn('Client fetch exception:', err);
    } finally {
      setLoading(false);
    }
  }, [keyword, selectedDept]);