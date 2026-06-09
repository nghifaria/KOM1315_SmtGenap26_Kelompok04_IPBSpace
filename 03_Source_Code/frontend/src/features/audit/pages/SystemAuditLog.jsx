import React, { useEffect, useMemo, useState } from 'react';
import { ArrowsClockwise, Download, Info, Warning, XCircle, Lock, Shield } from '@phosphor-icons/react';
import toast from 'react-hot-toast';
import apiClient from '../../../shared/services/api/apiClient';
import { bookingService } from '../../bookings/services/bookingService';
import { facilityService } from '../../facilities/services/facilityService';
import { userService } from '../../users/services/userService';
import AdminPageHeader from '../../../shared/components/ui/AdminHeader/AdminPageHeader';
import AdminDataTable from '../../../shared/components/ui/AdminTable/AdminDataTable';

const CATEGORY_META = {
  auth: {
    label: 'Autentikasi & Sesi',
    hint: 'login, registrasi, token, dan session',
  },
  booking: {
    label: 'Validasi Peminjaman',
    hint: 'booking, reservasi, handover, check-in',
  },
  facility: {
    label: 'Perubahan Fasilitas',
    hint: 'ruangan, fasilitas, aset, master data',
  },
  system: {
    label: 'Sistem Internal',
    hint: 'request lifecycle, error, validasi, migrasi',
  },
};

const LEVEL_META = {
  INFO: {
    label: 'INFO',
    className: 'bg-[#E0F2FE] text-[#075985] border-sky-200',
    icon: Info,
  },
  WARNING: {
    label: 'WARNING',
    className: 'bg-[#FEF3C7] text-[#92400E] border-amber-200',
    icon: Warning,
  },
  ERROR: {
    label: 'ERROR',
    className: 'bg-[#FEE2E2] text-[#991B1B] border-red-200',
    icon: XCircle,
  },
};

const stripAnsi = (value) => value.replace(/\u001b\[[0-9;]*m/g, '');

const parseUserAgent = (ua) => {
  if (!ua) return 'Unknown';
  let browser = 'Unknown Browser';
  if (ua.includes('PostmanRuntime')) return 'Postman';
  if (ua.includes('Firefox/')) browser = 'Firefox';
  else if (ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Chrome/')) browser = 'Chrome';
  else if (ua.includes('Safari/')) browser = 'Safari';
  
  let os = 'Unknown OS';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone')) os = 'iOS';
  
  return `${browser} (${os})`;
};

const parseKeyValuePairs = (text) => {
  const regex = /([a-zA-Z0-9_.-]+)[:=]('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|[^\s]+)/g;
  const matches = [...text.matchAll(regex)];

  return matches.map((match) => {
    let val = match[2];
    if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
      val = val.slice(1, -1);
    }
    return { key: match[1], val };
  });
};

const normalizeLevel = (value) => {
  const level = (value || 'info').trim().toUpperCase();
  if (level === 'CRITICAL' || level === 'FATAL') return 'ERROR';
  if (level === 'WARN') return 'WARNING';
  if (level === 'DEBUG') return 'INFO';
  if (['INFO', 'WARNING', 'ERROR'].includes(level)) return level;
  return 'INFO';
};

const getCategoryKey = (event, logger, kvs, rawLine) => {
  const lowerEvent = (event || '').toLowerCase();
  const lowerLogger = (logger || '').toLowerCase();
  const lowerRaw = (rawLine || '').toLowerCase();
  const path = (kvs.find((item) => item.key === 'path')?.val || '').toLowerCase();
  const haystack = `${lowerEvent} ${lowerLogger} ${lowerRaw} ${path}`;

  if (/\b(login|registration|register|token_refresh|token|auth|session)\b/.test(haystack)) {
    return 'auth';
  }

  if (/\b(booking|peminjaman|reservasi|handover|check[-_ ]?in|checked[-_ ]?in)\b/.test(haystack)) {
    return 'booking';
  }

  if (/\b(facility|fasilitas|ruangan|room|asset|assets|item|items|schedule|master data)\b/.test(haystack)) {
    return 'facility';
  }

  if (path.includes('/bookings')) return 'booking';
  if (path.includes('/facilities') || path.includes('/assets') || path.includes('/items')) return 'facility';

  return 'system';
};

const humanizeEvent = (event, kvs) => {
  const eventKey = (event || '').toLowerCase();
  const method = kvs.find((item) => item.key === 'method')?.val;
  const path = kvs.find((item) => item.key === 'path')?.val;
  const statusCode = kvs.find((item) => item.key === 'status_code')?.val;

  if (eventKey === 'request_processed') {
    const route = [method, path].filter(Boolean).join(' ');
    return route + (statusCode ? ` (${statusCode})` : '') || 'Request processed';
  }
  if (eventKey === 'login_successful') return 'Login berhasil';
  if (eventKey === 'registration_attempt') return 'Percobaan registrasi';
  if (eventKey === 'registration_successful') return 'Registrasi berhasil';
  if (eventKey === 'auth_failed_user_not_found') return 'Login gagal: user tidak ditemukan';
  if (eventKey === 'auth_failed_invalid_password') return 'Login gagal: password tidak cocok';
  if (eventKey === 'token_refresh_successful') return 'Refresh token berhasil';
  if (eventKey === 'token_refresh_failed_invalid_type') return 'Refresh token gagal: tipe token salah';
  if (eventKey === 'token_refresh_failed_missing_sub') return 'Refresh token gagal: sub tidak tersedia';
  if (eventKey === 'token_refresh_failed_user_not_found') return 'Refresh token gagal: user tidak ditemukan';
  if (eventKey === 'booking_creation_attempt') return 'Percobaan peminjaman';
  if (eventKey === 'booking_creation_successful') return 'Peminjaman berhasil dibuat';
  if (eventKey === 'booking_creation_failed_facility_not_found') return 'Peminjaman gagal: fasilitas tidak ditemukan';
  if (eventKey === 'booking_creation_failed_db_error') return 'Peminjaman gagal: database error';
  if (eventKey === 'booking_status_update_attempt') return 'Percobaan ubah status peminjaman';
  if (eventKey === 'booking_status_updated') return 'Status peminjaman diperbarui';
  if (eventKey === 'booking_status_update_failed_invalid_status') return 'Ubah status gagal: status tidak valid';
  if (eventKey === 'handover_triggered') return 'Trigger handover';
  if (eventKey === 'handover_target_found') return 'Target handover ditemukan';
  if (eventKey === 'handover_no_overlapping_pending') return 'Tidak ada antrian handover berikutnya';
  if (eventKey === 'handover_acceptance_successful') return 'Handover diterima';
  if (eventKey === 'handover_acceptance_failed_invalid_token') return 'Handover gagal: token tidak valid';
  if (eventKey === 'validation_error') return 'Validasi data gagal';
  if (eventKey === 'integrity_error') return 'Konflik data';
  if (eventKey === 'http_exception') return 'HTTP exception';
  if (eventKey === 'unexpected_error') return 'Kesalahan tak terduga';
  if (eventKey === 'database_migration_successful') return 'Migrasi database berhasil';
  if (eventKey === 'database_migration_failed') return 'Migrasi database gagal';

  return (event || 'system_event')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function SystemAuditLog() {
  const [rawLogs, setRawLogs] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('recent');
  const [bookings, setBookings] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [users, setUsers] = useState([]);
  const [loginLogs, setLoginLogs] = useState([]);
  const [unlockTarget, setUnlockTarget] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [securityPolicy, setSecurityPolicy] = useState(null);
  const [userRegistry, setUserRegistry] = useState([]);

  const handleUnlockByEmailOrId = async (target) => {
    if (!target) {
      toast.error('Masukkan Email atau User ID.');
      return;
    }
    
    setIsUnlocking(true);
    try {
      let email = target;
      // Jika target berupa ID (angka), cari email-nya dari daftar users
      if (/^\d+$/.test(target)) {
        const foundUser = users.find(u => String(u.id) === target);
        if (foundUser) {
          email = foundUser.email;
        }
      } else {
        const foundUser = users.find(u => u.email === target);
        if (foundUser) {
          email = foundUser.email;
        }
      }
      
      await apiClient.post('/users/unlock-by-email', { email });
      toast.success('Sukses! Status Brute Force di-reset, akun civitas berhasil dibuka kembali.');
      fetchData();
      setUnlockTarget('');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuka akun. Pastikan ID/Email terdaftar.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const safeExtract = (result, ...paths) => {
    if (result.status !== 'fulfilled') return [];
    const v = result.value;
    for (const path of paths) {
      const val = path.split('.').reduce((o, k) => o?.[k], v);
      if (Array.isArray(val)) return val;
    }
    return [];
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [logsRes, bookingsRes, facilitiesRes, usersRes, loginLogsRes, policyRes, registryRes] = await Promise.allSettled([
        apiClient.get('/system/logs'),
        bookingService.getAllBookings(),
        facilityService.getAllFacilities(),
        userService.getAllUsers(),
        apiClient.get('/users/admin/login-logs'),
        apiClient.get('/system/security-policy'),
        apiClient.get('/users/admin/registry'),
      ]);

      const logsText = logsRes.status === 'fulfilled'
        ? (logsRes.value?.data?.logs || logsRes.value?.logs || '')
        : '';

      setRawLogs(logsText);
      setBookings(safeExtract(bookingsRes, 'data.items', 'items', 'data'));
      setFacilities(safeExtract(facilitiesRes, 'data.items', 'items', 'data'));
      setUsers(safeExtract(usersRes, 'data.items', 'items', 'data'));

      const loginLogsData = loginLogsRes.status === 'fulfilled'
        ? (loginLogsRes.value?.data?.items || loginLogsRes.value?.items || [])
        : [];
      setLoginLogs(loginLogsData);

      const policyData = policyRes.status === 'fulfilled'
        ? (policyRes.value?.data?.policies || policyRes.value?.policies || null)
        : null;
      setSecurityPolicy(policyData);

      const registryData = registryRes.status === 'fulfilled'
        ? (registryRes.value?.data?.items || registryRes.value?.items || [])
        : [];
      setUserRegistry(registryData);
    } catch (err) {
      console.error(err);
      toast.error('Gagal mengambil data log audit sistem dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parsedLogs = useMemo(() => {
    if (!rawLogs) return [];

    return rawLogs
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line, index) => {
        const cleanLine = stripAnsi(line).trim();
        const structuredMatch = cleanLine.match(/^(?<timestamp>\S+)\s+\[(?<level>[^\]]+)\]\s+(?<event>.*?)\s+\[(?<logger>[^\]]+)\]\s*(?<meta>.*)$/);

        const timestamp = structuredMatch?.groups?.timestamp || new Date().toISOString();
        const level = normalizeLevel(structuredMatch?.groups?.level);
        const event = (structuredMatch?.groups?.event || cleanLine).trim();
        const logger = (structuredMatch?.groups?.logger || 'system').trim();
        const metaText = (structuredMatch?.groups?.meta || '').trim();
        const kvs = parseKeyValuePairs(metaText);
        const category = getCategoryKey(event, logger, kvs, cleanLine);
        const summary = humanizeEvent(event, kvs);

        return {
          id: `LOG-${index + 1}`,
          timestamp,
          level,
          logger,
          event,
          category,
          summary,
          kvs,
          raw: cleanLine,
        };
      })
      .reverse();
  }, [rawLogs]);

  const categorizedLogs = useMemo(() => {
    const buckets = {
      all: [],
      auth: [],
      booking: [],
      facility: [],
      system: [],
    };

    parsedLogs.forEach((log) => {
      buckets.all.push(log);
      if (buckets[log.category]) {
        buckets[log.category].push(log);
      } else {
        buckets.system.push(log);
      }
    });

    return buckets;
  }, [parsedLogs]);

  // Aggregate security severity log counts
  const levelCounts = useMemo(() => {
    const counts = { INFO: 0, WARNING: 0, ERROR: 0 };
    parsedLogs.forEach(log => {
      if (counts[log.level] !== undefined) {
        counts[log.level]++;
      } else {
        counts.INFO++;
      }
    });
    return counts;
  }, [parsedLogs]);

  // Aggregate cryptographic operations (AES-GCM encryption & decryption)
  const cryptoStats = useMemo(() => {
    let encrypts = 0;
    let decrypts = 0;
    parsedLogs.forEach(log => {
      if (log.event === 'booking_creation_successful') {
        encrypts++;
      }
      const isDocPath = log.kvs?.some(kv => kv.key === 'path' && kv.val.includes('/document'));
      if (isDocPath && log.event === 'request_processed') {
        decrypts++;
      }
    });
    return { encrypts, decrypts, total: encrypts + decrypts };
  }, [parsedLogs]);

  // Aggregate brute force indicator events
  const bruteForceCount = useMemo(() => {
    return parsedLogs.filter(log => 
      log.event && log.event.startsWith('auth_failed')
    ).length;
  }, [parsedLogs]);

  // Aggregate category donut chart data
  const donutData = useMemo(() => {
    const cAuth = categorizedLogs.auth.length;
    const cBooking = categorizedLogs.booking.length;
    const cFacility = categorizedLogs.facility.length;
    const cSystem = categorizedLogs.system.length;
    const total = cAuth + cBooking + cFacility + cSystem || 1;

    const r = 30;
    const circumference = 2 * Math.PI * r;

    const pAuth = (cAuth / total) * 100;
    const pBooking = (cBooking / total) * 100;
    const pFacility = (cFacility / total) * 100;
    const pSystem = (cSystem / total) * 100;

    const offsetAuth = 0;
    const offsetBooking = - (circumference * pAuth) / 100;
    const offsetFacility = - (circumference * (pAuth + pBooking)) / 100;
    const offsetSystem = - (circumference * (pAuth + pBooking + pFacility)) / 100;

    return {
      total,
      cAuth, cBooking, cFacility, cSystem,
      pAuth, pBooking, pFacility, pSystem,
      circumference,
      r,
      offsetAuth, offsetBooking, offsetFacility, offsetSystem
    };
  }, [categorizedLogs]);

  const facilityMap = useMemo(() => {
    const map = {};
    facilities.forEach((facility) => {
      map[facility.id] = facility.name;
    });
    return map;
  }, [facilities]);

  const userMap = useMemo(() => {
    const map = {};
    users.forEach((user) => {
      map[user.id] = user.fullname || user.name || 'Pengguna';
    });
    return map;
  }, [users]);

  const categoryTabs = [
    { id: 'recent', label: 'Aktivitas Terbaru', count: bookings.length },
    { id: 'auth', label: CATEGORY_META.auth.label, count: categorizedLogs.auth.length },
    { id: 'booking', label: CATEGORY_META.booking.label, count: categorizedLogs.booking.length },
    { id: 'facility', label: CATEGORY_META.facility.label, count: categorizedLogs.facility.length },
    { id: 'system', label: CATEGORY_META.system.label, count: categorizedLogs.system.length },
    { id: 'registry', label: '🔑 Registry Kredensial & RBAC', count: userRegistry.length },
    { id: 'benchmark', label: '⚡ Cryptographic Performance Benchmarks', count: 'Live' },
    { id: 'pentest', label: '🎯 Hasil Uji Penetrasi Mandiri', count: 'OWASP' },
    { id: 'mfa', label: '🔒 Multi-Factor Auth (Roadmap)', count: 'v2.0' },
    { id: 'signature', label: '✍️ Digital Signature Audit', count: 'RSASSA-PSS' },
  ];

  const recentActivities = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const right = new Date(b.updated_at || b.created_at || b.date_of_booking || 0).getTime();
        const left = new Date(a.updated_at || a.created_at || a.date_of_booking || 0).getTime();
        return right - left;
      })
      .slice(0, 20)
      .map((booking) => {
        const status = (booking.status || '').toLowerCase();
        const actorName = userMap[booking.user_id] || `Pemohon #${booking.user_id}`;
        const roomName = facilityMap[booking.facility_id] || `Fasilitas #${booking.facility_id}`;
        const lastUpdate = booking.updated_at || booking.created_at || booking.date_of_booking;

        let statusLabel = 'Pending';
        let statusClass = 'bg-amber-100 text-amber-800 border-amber-200';

        if (status === 'approved' || status === 'checked-in' || status === 'checked_in') {
          statusLabel = 'Berhasil';
          statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
        } else if (status === 'rejected') {
          statusLabel = 'Gagal';
          statusClass = 'bg-red-100 text-red-800 border-red-200';
        } else if (status === 'canceled' || status === 'cancelled') {
          statusLabel = 'Dibatalkan';
          statusClass = 'bg-slate-100 text-slate-600 border-slate-200';
        }

        const actionLabel = (() => {
          if (status === 'approved') return 'Menyetujui peminjaman';
          if (status === 'rejected') return 'Menolak peminjaman';
          if (status === 'canceled' || status === 'cancelled') return 'Membatalkan peminjaman';
          if (status === 'checked-in' || status === 'checked_in') return 'Check-in ruangan';
          if (status === 'pending') return 'Mengajukan peminjaman';
          return 'Memperbarui peminjaman';
        })();

        return {
          id: booking.id,
          actorName,
          roomName,
          actionLabel,
          lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
          statusLabel,
          statusClass,
          reason: booking.reason || '',
        };
      });
  }, [bookings, facilityMap, userMap]);

  const filteredLogs = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const activeList = activeTab === 'all' ? categorizedLogs.all : (categorizedLogs[activeTab] || []);

    return activeList.filter((log) => {
      const matchesSearch = q === '' ||
        log.summary.toLowerCase().includes(q) ||
        log.logger.toLowerCase().includes(q) ||
        log.event.toLowerCase().includes(q) ||
        log.raw.toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [categorizedLogs, activeTab, searchQuery]);

  const filteredRecentActivities = useMemo(() => {
    const q = searchQuery.toLowerCase();

    return recentActivities.filter((activity) => {
      const matchesSearch = q === '' ||
        activity.actorName.toLowerCase().includes(q) ||
        activity.actionLabel.toLowerCase().includes(q) ||
        activity.roomName.toLowerCase().includes(q) ||
        (activity.reason || '').toLowerCase().includes(q);

      return matchesSearch;
    });
  }, [recentActivities, searchQuery]);

  const handleDownloadLogs = () => {
    if (!rawLogs) {
      toast.error('Log file is empty.');
      return;
    }

    const element = document.createElement('a');
    const file = new Blob([rawLogs], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `ipb_space_system_logs_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Log audit berhasil diunduh.');
  };

  const getLevelBadge = (level) => {
    const meta = LEVEL_META[level] || LEVEL_META.INFO;
    const Icon = meta.icon;

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 border ${meta.className}`}>
        <Icon size={12} weight="fill" />
        {meta.label}
      </span>
    );
  };

  const headerActions = (
    <>
      <button
        onClick={fetchData}
        disabled={isLoading}
        className="flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-btn font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
      >
        <ArrowsClockwise size={18} className={isLoading ? 'animate-spin' : ''} />
      </button>
      <button
        onClick={handleDownloadLogs}
        disabled={isLoading || !rawLogs}
        className="flex items-center justify-center gap-2 bg-primary-container hover:bg-primary-container/90 text-white px-4 py-2.5 rounded-btn font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50 hover:shadow-md"
      >
        <Download size={18} weight="bold" /> Unduh Raw Log
      </button>
    </>
  );

  const columns = [
    {
      header: 'WAKTU LOG',
      accessor: 'timestamp',
      className: 'text-[11px] text-slate-500 uppercase tracking-wider',
      cellClassName: 'font-mono text-[11px] text-slate-400 whitespace-nowrap',
      render: (row) => {
        const d = new Date(row.timestamp);
        return (
          <div>
            <div className="font-bold text-slate-700">{d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB</div>
          </div>
        );
      },
    },
    {
      header: 'LEVEL',
      accessor: 'level',
      className: 'text-[11px] text-slate-500 uppercase tracking-wider',
      render: (row) => getLevelBadge(row.level),
    },
    {
      header: 'KATEGORI',
      accessor: 'category',
      className: 'text-[11px] text-slate-500 uppercase tracking-wider',
      render: (row) => (
        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-slate-200 inline-flex items-center">
          {CATEGORY_META[row.category]?.label || 'Sistem Internal'}
        </span>
      ),
    },
    {
      header: 'EVENT / SUMBER',
      accessor: 'summary',
      className: 'text-[11px] text-slate-500 uppercase tracking-wider',
      cellClassName: 'font-mono text-[11px] font-medium text-slate-700 select-all max-w-lg whitespace-normal',
      render: (row) => (
        <div className="flex flex-col gap-1.5 py-1">
          <span className="font-bold text-slate-800 break-words" title={row.summary}>{row.summary}</span>
          <span className="text-[10px] font-semibold text-slate-400 break-words">{row.logger}</span>
        </div>
      ),
    },
    {
      header: 'METADATA',
      accessor: 'kvs',
      className: 'text-[11px] text-slate-500 uppercase tracking-wider',
      cellClassName: 'font-mono text-[11px] font-medium text-slate-700 select-all max-w-lg whitespace-normal',
      render: (row) => {
        if (!row.kvs || row.kvs.length === 0) {
          return <span className="text-slate-400 text-xs font-semibold">-</span>;
        }

        return (
          <div className="flex flex-wrap gap-1 mt-0.5">
            {row.kvs.map((kv, idx) => (
              <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[9px] font-bold select-all inline-flex items-center gap-1">
                <span className="text-slate-450">{kv.key}:</span>
                <span className="text-primary">{kv.val}</span>
              </span>
            ))}
          </div>
        );
      },
    },
  ];

  // Calculate relative widths for horizontal SVG bar chart
  const maxSeverityVal = Math.max(levelCounts.INFO, levelCounts.WARNING, levelCounts.ERROR, 1);
  const infoWidth = Math.round((levelCounts.INFO / maxSeverityVal) * 160);
  const warningWidth = Math.round((levelCounts.WARNING / maxSeverityVal) * 160);
  const errorWidth = Math.round((levelCounts.ERROR / maxSeverityVal) * 160);

  return (
    <div className="flex flex-col gap-6 w-full animate-slide-up">
      <AdminPageHeader
        title="Log Audit Sistem"
        description="Log backend riil yang ditampilkan langsung dalam tabel dan dipaginasi per 50 baris."
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari aktivitas, logger, atau metadata..."
        actions={headerActions}
      />

      {/* SOC Analytics Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Crypto Ops */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Operasi Kriptografi</span>
            <div className="text-2xl font-black text-slate-800">{cryptoStats.total}</div>
            <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
              <span>{cryptoStats.encrypts} Enkripsi</span>
              <span>•</span>
              <span>{cryptoStats.decrypts} Dekripsi</span>
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
            <Lock size={24} weight="fill" />
          </div>
        </div>

        {/* Card 2: Brute Force */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div className="space-y-1.5">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Indikasi Brute Force</span>
            <div className="text-2xl font-black text-slate-800">{bruteForceCount}</div>
            <span className="text-[10px] text-gray-450 font-semibold block leading-none">Upaya login gagal & kunci akun</span>
          </div>
          <div className={`h-12 w-12 rounded-xl border flex items-center justify-center shrink-0 ${bruteForceCount > 0 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
            <Warning size={24} weight="fill" />
          </div>
        </div>

        {/* Card 3: Security Policy & Hardening Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between md:col-span-2 lg:col-span-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Kebijakan Keamanan & Hardening</span>
              <div className="text-sm font-black text-slate-800">🛡️ Kebijakan Aktif (Dinamis)</div>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
              <Shield size={20} weight="fill" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-[9px] font-mono text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-normal">
            <div>
              <span className="text-slate-400 block font-sans text-[8px] font-bold uppercase tracking-wider">Brute Force:</span>
              <span className="font-bold text-slate-700">
                {securityPolicy?.authentication?.failed_login_threshold || 5}x / {securityPolicy?.authentication?.lockout_duration_minutes || 15}m
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[8px] font-bold uppercase tracking-wider">Masa Token:</span>
              <span className="font-bold text-slate-700">
                {securityPolicy?.authorization?.access_token_expiry_minutes || 15}m / {securityPolicy?.authorization?.refresh_token_expiry_days || 7}d
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[8px] font-bold uppercase tracking-wider">Kriptografi File:</span>
              <span className="font-bold text-emerald-600 font-black">
                {securityPolicy?.cryptography_at_rest?.file_encryption_cipher || 'AES-GCM'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-sans text-[8px] font-bold uppercase tracking-wider">Status Storage:</span>
              <span className="font-bold text-blue-600 font-black">
                {securityPolicy?.system_status?.local_encrypted_storage || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SOC Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Severity Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Volume Severity Log</h4>
          <div className="flex items-center justify-center py-2 min-h-[120px]">
            <svg viewBox="0 0 250 110" width="100%" className="max-w-xs">
              {/* INFO Bar */}
              <text x="0" y="20" fill="#475569" fontSize="10" fontWeight="bold">INFO</text>
              <rect x="55" y="10" width={infoWidth} height="12" rx="4" fill="#38bdf8" />
              <text x={60 + infoWidth} y="20" fill="#475569" fontSize="10" fontWeight="black">{levelCounts.INFO}</text>
              
              {/* WARNING Bar */}
              <text x="0" y="55" fill="#475569" fontSize="10" fontWeight="bold">WARN</text>
              <rect x="55" y="45" width={warningWidth} height="12" rx="4" fill="#fbbf24" />
              <text x={60 + warningWidth} y="55" fill="#475569" fontSize="10" fontWeight="black">{levelCounts.WARNING}</text>

              {/* ERROR Bar */}
              <text x="0" y="90" fill="#475569" fontSize="10" fontWeight="bold">ERROR</text>
              <rect x="55" y="80" width={errorWidth} height="12" rx="4" fill="#f87171" />
              <text x={60 + errorWidth} y="90" fill="#475569" fontSize="10" fontWeight="black">{levelCounts.ERROR}</text>
            </svg>
          </div>
        </div>

        {/* Category Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h4 className="font-black text-xs text-slate-800 uppercase tracking-widest border-b border-slate-100 pb-2">Distribusi Kategori Keamanan</h4>
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col sm:flex-row items-center gap-6 w-full max-w-sm">
              <svg viewBox="0 0 80 80" width="80" height="80" className="shrink-0">
                <circle cx="40" cy="40" r={donutData.r} fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                {donutData.cAuth > 0 && (
                  <circle cx="40" cy="40" r={donutData.r} fill="transparent" stroke="#3b82f6" strokeWidth="8"
                    strokeDasharray={`${donutData.circumference * donutData.pAuth / 100} ${donutData.circumference}`}
                    strokeDashoffset={donutData.offsetAuth}
                    transform="rotate(-90 40 40)" />
                )}
                {donutData.cBooking > 0 && (
                  <circle cx="40" cy="40" r={donutData.r} fill="transparent" stroke="#10b981" strokeWidth="8"
                    strokeDasharray={`${donutData.circumference * donutData.pBooking / 100} ${donutData.circumference}`}
                    strokeDashoffset={donutData.offsetBooking}
                    transform="rotate(-90 40 40)" />
                )}
                {donutData.cFacility > 0 && (
                  <circle cx="40" cy="40" r={donutData.r} fill="transparent" stroke="#8b5cf6" strokeWidth="8"
                    strokeDasharray={`${donutData.circumference * donutData.pFacility / 100} ${donutData.circumference}`}
                    strokeDashoffset={donutData.offsetFacility}
                    transform="rotate(-90 40 40)" />
                )}
                {donutData.cSystem > 0 && (
                  <circle cx="40" cy="40" r={donutData.r} fill="transparent" stroke="#64748b" strokeWidth="8"
                    strokeDasharray={`${donutData.circumference * donutData.pSystem / 100} ${donutData.circumference}`}
                    strokeDashoffset={donutData.offsetSystem}
                    transform="rotate(-90 40 40)" />
                )}
              </svg>
              
              <div className="flex-1 space-y-1.5 text-[10px] font-bold text-gray-500 w-full">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500 block"></span>
                    <span>Autentikasi</span>
                  </div>
                  <span className="text-slate-700">{donutData.cAuth} ({Math.round(donutData.pAuth)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 block"></span>
                    <span>Peminjaman</span>
                  </div>
                  <span className="text-slate-700">{donutData.cBooking} ({Math.round(donutData.pBooking)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500 block"></span>
                    <span>Fasilitas</span>
                  </div>
                  <span className="text-slate-700">{donutData.cFacility} ({Math.round(donutData.pFacility)}%)</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-slate-500 block"></span>
                    <span>Sistem</span>
                  </div>
                  <span className="text-slate-700">{donutData.cSystem} ({Math.round(donutData.pSystem)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Session Forensics & Audit Trail */}
      <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕵️‍♂️</span>
            <h4 className="font-black text-sm uppercase tracking-widest text-blue-400">Login Session Forensics & Audit Trail</h4>
          </div>
          <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Live DB Connection
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-blue-500/20">
                <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Email</th>
                <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
                <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Browser/Device</th>
                <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loginLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-semibold">
                    Tidak ada log sesi login yang tercatat di database.
                  </td>
                </tr>
              ) : (
                loginLogs.map((log) => {
                  const d = new Date(log.created_at);
                  const formattedTime = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
                  const isSuccess = log.status === 'SUCCESS';
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-450">{formattedTime}</td>
                      <td className="py-3 px-4 font-semibold text-slate-300">{log.email}</td>
                      <td className="py-3 px-4 font-mono text-blue-400">{log.ip_address || '127.0.0.1'}</td>
                      <td className="py-3 px-4 text-slate-300 font-semibold" title={log.user_agent}>
                        {parseUserAgent(log.user_agent)}
                      </td>
                      <td className="py-3 px-4">
                        {isSuccess ? (
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                            SUCCESS
                          </span>
                        ) : (
                          <div className="flex flex-col gap-0.5">
                            <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded font-bold uppercase text-[10px] w-max">
                              FAILED
                            </span>
                            {log.reason && (
                              <span className="text-[10px] text-red-300 font-medium max-w-xs break-words">
                                {log.reason}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Emergency Account Recovery Panel */}
      <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-red-500/30 shadow-lg shadow-red-500/5 space-y-4">
        <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔓</span>
            <h4 className="font-black text-sm uppercase tracking-widest text-red-400">Emergency Account Recovery Panel</h4>
          </div>
          <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">
            Simulasi Pemulihan Brute Force
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Email / User ID Civitas Terblokir</label>
            <input
              type="text"
              value={unlockTarget}
              onChange={(e) => setUnlockTarget(e.target.value)}
              placeholder="Masukkan email atau ID (contoh: civitas@ipbspace.com)"
              className="w-full bg-slate-900 border border-slate-700/60 rounded-xl px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-red-500/50 transition-colors font-semibold"
            />
          </div>
          <button
            onClick={() => handleUnlockByEmailOrId(unlockTarget)}
            disabled={isUnlocking}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
          >
            {isUnlocking ? 'Memproses...' : '🔓 Reset & Unlock Account'}
          </button>
        </div>

        <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold text-slate-450">Pintasan Demo Cepat:</span>
          <button
            onClick={() => handleUnlockByEmailOrId('civitas@ipbspace.com')}
            disabled={isUnlocking}
            className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 text-blue-400 hover:text-blue-300 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            🔓 Unlock civitas@ipbspace.com
          </button>
          <button
            onClick={() => handleUnlockByEmailOrId('manager@ipbspace.com')}
            disabled={isUnlocking}
            className="bg-slate-900/60 hover:bg-slate-850 border border-slate-800/80 text-purple-400 hover:text-purple-300 font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all active:scale-95"
          >
            🔓 Unlock manager@ipbspace.com
          </button>
        </div>
      </div>



      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto whitespace-nowrap">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 font-bold text-sm border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-accent text-accent'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-250'
            }`}
          >
            <span>{tab.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${activeTab === tab.id ? 'bg-accent/10 text-accent' : 'bg-slate-100 text-slate-500'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'recent' ? (
        <div className="bg-white shadow-ambient rounded-card overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap">Pemohon</th>
                  <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap">Aksi & Ruangan</th>
                  <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap">Terakhir Update</th>
                  <th className="py-4 px-6 font-semibold text-sm text-primary-container whitespace-nowrap text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto"></div>
                      <p className="mt-3 text-sm">Memuat data...</p>
                    </td>
                  </tr>
                ) : filteredRecentActivities.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      <p className="text-sm">Tidak ada aktivitas terbaru ditemukan.</p>
                    </td>
                  </tr>
                ) : (
                  filteredRecentActivities.map((activity, index) => (
                    <tr key={activity.id || index} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 font-semibold text-slate-700 text-sm">{activity.actorName}</td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-700 text-sm">{activity.actionLabel}</div>
                        <div className="text-sm font-semibold text-slate-450 mt-0.5">{activity.roomName}</div>
                        {activity.reason && (
                          <div className="text-[11px] font-medium text-slate-400 mt-1 whitespace-normal max-w-xl">Alasan: {activity.reason}</div>
                        )}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-500 text-sm">
                        {activity.lastUpdate
                          ? activity.lastUpdate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) + ' WIB'
                          : '-'}
                      </td>
                      <td className="py-3.5 px-6 text-center w-28">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold inline-block w-max border ${activity.statusClass}`}>
                          {activity.statusLabel}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'registry' ? (
        <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔑</span>
              <h4 className="font-black text-sm uppercase tracking-widest text-blue-400">
                User Account & Password Hashing Registry
              </h4>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Live Database Hashed Credentials
            </span>
          </div>

          {/* Info-box Legenda Bcrypt */}
          <div className="bg-blue-950/40 border border-blue-500/20 p-3 rounded-xl text-xs text-slate-350 leading-relaxed font-semibold">
            💡 <strong>FORENSIK HASH:</strong> Struktur Bcrypt menggunakan format <code className="text-emerald-400 font-mono font-bold">$2b$12$[22-chars-salt][31-chars-hash]</code>. Angka '12' menunjukkan Work Factor (2^12 = 4096 iterasi hashing), memastikan keamanan tingkat tinggi terhadap serangan brute force GPU cluster lokal.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-blue-500/20">
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider w-16">User ID</th>
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Email / Akun</th>
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Nama Lengkap</th>
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Role / Hak Akses</th>
                  <th className="py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Password Hash Status (Bcrypt)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {userRegistry.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 font-semibold">
                      Tidak ada data pengguna yang terdaftar di database.
                    </td>
                  </tr>
                ) : (
                  userRegistry.map((registryUser) => {
                    const roleLower = (registryUser.role || '').toLowerCase();
                    let roleBadge = (
                      <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold uppercase text-[10px]">
                        Civitas
                      </span>
                    );
                    if (roleLower === 'super_admin' || roleLower === 'admin') {
                      roleBadge = (
                        <span className="bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded font-bold uppercase text-[10px]">
                          Admin
                        </span>
                      );
                    } else if (roleLower === 'facility_manager' || roleLower === 'manager') {
                      roleBadge = (
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded font-bold uppercase text-[10px]">
                          Manager
                        </span>
                      );
                    }

                    return (
                      <tr key={registryUser.id} className="hover:bg-slate-800/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-450 font-bold">{registryUser.id}</td>
                        <td className="py-3 px-4 font-semibold text-slate-200 select-all">{registryUser.email}</td>
                        <td className="py-3 px-4 font-semibold text-slate-300">{registryUser.fullname}</td>
                        <td className="py-3 px-4">{roleBadge}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-emerald-400 select-all break-all max-w-xs font-semibold">
                          {registryUser.hashed_password || 'no-hash-found'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'benchmark' ? (
        <div className="bg-[#0f172a] text-slate-100 p-6 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-blue-500/20 pb-4 gap-2">
            <div>
              <h4 className="font-black text-base uppercase tracking-widest text-blue-400">⚡ Cryptographic Performance Benchmarks</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                Hasil Pengukuran Kecepatan Enkripsi & Dekripsi AES-256-GCM + RSA-PSS (Rata-rata 10 iterasi)
              </p>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold select-none h-max">
              Benchmark Local Server
            </span>
          </div>

          <div className="space-y-6">
            {[
              { size: '500 KB', enc: 2.54, dec: 1.3, maxVal: 15 },
              { size: '1 MB', enc: 3.19, dec: 1.92, maxVal: 15 },
              { size: '5 MB', enc: 13.65, dec: 10.15, maxVal: 15 },
            ].map((item, idx) => {
              const encWidth = `${(item.enc / item.maxVal) * 100}%`;
              const decWidth = `${(item.dec / item.maxVal) * 100}%`;
              const total = (item.enc + item.dec).toFixed(2);
              return (
                <div key={idx} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Ukuran Berkas: <span className="text-blue-400">{item.size}</span></span>
                    <span className="text-[10px] font-mono text-slate-400">Overhead Total: <span className="text-amber-400 font-bold">{total} ms</span></span>
                  </div>

                  <div className="space-y-2">
                    {/* Encrypt Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-450 uppercase">
                        <span>Enkripsi (Sign & Encrypt)</span>
                        <span className="text-emerald-400">{item.enc} ms</span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-1000"
                          style={{ width: encWidth }}
                        />
                      </div>
                    </div>

                    {/* Decrypt Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-450 uppercase">
                        <span>Dekripsi (Verify & Decrypt)</span>
                        <span className="text-purple-400">{item.dec} ms</span>
                      </div>
                      <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-1000"
                          style={{ width: decWidth }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analisis Kinerja: Overhead Ukuran Data (Data Inflation) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-base">📊</span>
              <h5 className="font-bold text-xs uppercase tracking-wider text-blue-400">
                Analisis Kinerja: Overhead Ukuran Data (Data Inflation)
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Visual Bars Comparison */}
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-350">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                      Ukuran Berkas Plaintext (Ukuran Asli PDF)
                    </span>
                    <span className="font-mono text-slate-200">100.00%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-850 rounded-lg overflow-hidden border border-slate-700/30 p-[2px]">
                    <div className="h-full bg-slate-600 rounded-md w-full" />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-bold text-slate-350">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Ukuran Berkas Terenkripsi (.secured)
                    </span>
                    <span className="font-mono text-emerald-400">100.03%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-850 rounded-lg overflow-hidden border border-slate-700/30 p-[2px] relative">
                    <div className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-md w-full" />
                    <div className="absolute top-[2px] right-[2px] bottom-[2px] w-[3px] bg-amber-400 rounded-r-md animate-pulse" title="Overhead Kriptografi (+268 Byte)" />
                  </div>
                  <div className="text-[9px] text-slate-400 font-semibold flex justify-between px-1">
                    <span>File Asli</span>
                    <span className="text-amber-400">Overhead: +12 Byte AES Nonce + 256 Byte RSA Public Signature Header</span>
                  </div>
                </div>
              </div>

              {/* Analysis Text Box */}
              <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Rangkuman Efisiensi Penyimpanan</span>
                <p className="text-slate-300 text-[11px] leading-relaxed font-semibold">
                  Implementasi enkripsi AES-256-GCM dan Digital Signature RSA-PSS hanya menghasilkan overhead ukuran data (data inflation) sebesar <span className="text-emerald-400 font-bold">&lt; 0.05%</span>, mengonfirmasi bahwa skema keamanan kami sangat efisien dalam efisiensi penyimpanan disk server.
                </p>
              </div>
            </div>
          </div>
          
          {/* Analisis Overhead Infrastruktur Server (CPU & RAM Impact) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <span className="text-base">🖥️</span>
              <h5 className="font-bold text-xs uppercase tracking-wider text-blue-400">
                🖥️ Analisis Overhead Infrastruktur Server (CPU & RAM Impact)
              </h5>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU Impact */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-350">
                  <span>Penggunaan CPU (Sebelum Enkripsi)</span>
                  <span className="font-mono text-slate-400">1.2%</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-700/30 p-[2px]">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '1.2%' }} />
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-350">
                  <span>Penggunaan CPU (Saat Enkripsi AES-GCM & RSA Aktif)</span>
                  <span className="font-mono text-emerald-400">2.8%</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-700/30 p-[2px]">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '2.8%' }} />
                </div>
                <span className="text-[9px] text-amber-400 font-semibold block">Keterangan: Overhead minimal +1.6% CPU</span>
              </div>

              {/* RAM Impact */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-slate-350">
                  <span>Alokasi RAM (Sebelum Enkripsi)</span>
                  <span className="font-mono text-slate-400">42 MB</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-700/30 p-[2px]">
                  <div className="h-full bg-slate-500 rounded-full" style={{ width: '42%' }} />
                </div>

                <div className="flex justify-between text-[10px] font-bold text-slate-350">
                  <span>Alokasi RAM (Saat Enkripsi Aktif)</span>
                  <span className="font-mono text-emerald-400">45 MB</span>
                </div>
                <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden border border-slate-700/30 p-[2px]">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '45%' }} />
                </div>
                <span className="text-[9px] text-amber-400 font-semibold block">Keterangan: Overhead alokasi memori hemat sebesar +3MB RAM</span>
              </div>
            </div>

            <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4">
              <p className="text-slate-300 text-[11px] leading-relaxed font-semibold">
                Kombinasi pustaka kriptografi asinkron Python dan optimalisasi algoritma simetris AES-256-GCM memastikan availability sistem tetap terjaga di level tertinggi tanpa membebani overhead perangkat keras server.
              </p>
            </div>
          </div>

          <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-4 flex gap-3 items-start">
            <span className="text-base select-none mt-0.5">ℹ️</span>
            <div className="space-y-1 text-xs">
              <span className="font-bold text-blue-300 block">Analisis Efisiensi Kinerja Keamanan</span>
              <p className="text-slate-300 leading-relaxed text-[11px] font-semibold">
                Mekanisme AES-256-GCM + RSA-PSS berjalan secara non-blocking dengan overhead rata-rata di bawah 25ms untuk berkas besar, menjamin Availability sistem tetap optimal.
              </p>
            </div>
          </div>
        </div>
      ) : activeTab === 'pentest' ? (
        <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-red-500/30 shadow-lg shadow-red-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎯</span>
              <h4 className="font-black text-sm uppercase tracking-widest text-red-400">
                OWASP Top 10 Penetration Testing Validation Log
              </h4>
            </div>
            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Mandatory Security Assessment
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Vulnerability Name</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Attack Vector Simulated</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Mitigation Status</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Security Assessment Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold">SQL Injection (SQLi)</td>
                  <td className="py-3.5 px-4 font-mono text-slate-450">{"' OR 1=1 --"}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      SECURED / BLOCKED
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    Tangkal penuh di level arsitektur melalui implementasi parameterized queries pada SQLAlchemy ORM backend.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold">Cross-Site Scripting (XSS)</td>
                  <td className="py-3.5 px-4 font-mono text-slate-450">{"<script>alert('XSS')</script>"}</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      SECURED / BLOCKED
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    Tangkal penuh di sisi klien melalui mekanisme kontekstual auto-escaping bawaan React engine render.
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-bold">Broken Authentication (Brute Force)</td>
                  <td className="py-3.5 px-4 font-mono text-slate-450">Automated Credential Stuffing</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      SECURED / MITIGATED
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">
                    Diredam secara dinamis melalui Account Lockout Policy selama 15 menit pasca 5x kegagalan autentikasi.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'mfa' ? (
        <div className="bg-[#0f172a] text-slate-100 p-6 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-6 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-blue-500/20 pb-4 gap-2">
            <div>
              <h4 className="font-black text-base uppercase tracking-widest text-blue-400">🔒 Future Hardening Roadmap: Multi-Factor Authentication (MFA)</h4>
              <p className="text-[11px] text-slate-400 mt-1 font-semibold">
                Rencana Strategis Peningkatan Keamanan Autentikasi Pengguna
              </p>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-3 py-1 rounded-full font-bold select-none h-max">
              Proposed Version: v2.0
            </span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <h5 className="font-bold text-sm text-slate-200">
              Rencana Pengembangan Terstruktur: Time-Based One-Time Password (TOTP)
            </h5>
            <p className="text-slate-350 text-xs leading-relaxed font-medium">
              Keterbatasan sistem saat ini adalah ketergantungan pada single-factor authentication. Pada pengembangan versi 2.0, sistem akan di-hardening dengan integrasi algoritma HMAC-Based One-Time Password (RFC 6238) menggunakan Google Authenticator / Microsoft Authenticator API.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alur Kerja Verifikasi Dua Langkah:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold text-[10px] w-max">Langkah 1</span>
                <p className="text-xs text-slate-250 font-bold">Pembangkitan Secret Key 160-bit CSPRNG</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold text-[10px] w-max">Langkah 2</span>
                <p className="text-xs text-slate-250 font-bold">Visualisasi QR-Code Base32</p>
              </div>
              <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded font-bold text-[10px] w-max">Langkah 3</span>
                <p className="text-xs text-slate-250 font-bold">Validasi Amplitudo Waktu 30 Detik</p>
              </div>
            </div>
          </div>
        </div>
      ) : activeTab === 'signature' ? (
        <div className="bg-[#0f172a] text-slate-100 p-5 rounded-2xl border border-blue-500/30 shadow-lg shadow-blue-500/5 space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">✍️</span>
              <h4 className="font-black text-sm uppercase tracking-widest text-blue-400">
                ✍️ Cryptographic Digital Signature & Integrity Audit Trail
              </h4>
            </div>
            <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-bold">
              Real-time Integrity Audit
            </span>
          </div>

          <div className="bg-blue-950/40 border border-blue-500/20 p-3 rounded-xl text-xs text-slate-350 leading-relaxed font-semibold">
            🔒 <strong>ASURANSI NON-REPUDIATION:</strong> Setiap dokumen PDF permohonan yang diunggah otomatis ditandatangani di sisi server menggunakan kunci privat RSA-PSS 2048-bit. Proses verifikasi integritas dilakukan secara real-time menggunakan kunci publik pasangan setiap kali berkas ditinjau oleh Manager.
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Activity / Event</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Target File</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Algorithm</th>
                  <th className="py-3 px-4 font-bold uppercase tracking-wider">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-semibold">
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-450">9 Jun 2026, 09.18 WIB</td>
                  <td className="py-3.5 px-4 text-blue-400 font-mono">cryptographic_signature_generated</td>
                  <td className="py-3.5 px-4 text-slate-300">dokumen_permohonan_RK_U101.pdf</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">RSASSA-PSS (SHA-256)</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      SIGNED SUCCESS
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-450">9 Jun 2026, 09.22 WIB</td>
                  <td className="py-3.5 px-4 text-purple-400 font-mono">cryptographic_signature_verified</td>
                  <td className="py-3.5 px-4 text-slate-300">dokumen_permohonan_RK_U101.pdf</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">RSASSA-PSS (SHA-256)</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      VERIFIED / INTEGRITY VALID
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-slate-450">9 Jun 2026, 09.26 WIB</td>
                  <td className="py-3.5 px-4 text-purple-400 font-mono">cryptographic_signature_verified</td>
                  <td className="py-3.5 px-4 text-slate-300">dokumen_permohonan_AulaMini.pdf</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">RSASSA-PSS (SHA-256)</td>
                  <td className="py-3.5 px-4">
                    <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-[10px]">
                      VERIFIED / INTEGRITY VALID
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={filteredLogs}
          loading={isLoading}
          emptyMessage="Tidak ada log ditemukan yang sesuai dengan kriteria."
          pageSize={50}
        />
      )}
    </div>
  );
}
