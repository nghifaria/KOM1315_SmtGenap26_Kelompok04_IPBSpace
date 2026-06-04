import React, { useEffect, useMemo, useState } from 'react';
import { ArrowsClockwise, Download, Info, Warning, XCircle } from '@phosphor-icons/react';
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
      const [logsRes, bookingsRes, facilitiesRes, usersRes] = await Promise.allSettled([
        apiClient.get('/system/logs'),
        bookingService.getAllBookings(),
        facilityService.getAllFacilities(),
        userService.getAllUsers(),
      ]);

      const logsText = logsRes.status === 'fulfilled'
        ? (logsRes.value?.data?.logs || logsRes.value?.logs || '')
        : '';

      setRawLogs(logsText);
      setBookings(safeExtract(bookingsRes, 'data.items', 'items', 'data'));
      setFacilities(safeExtract(facilitiesRes, 'data.items', 'items', 'data'));
      setUsers(safeExtract(usersRes, 'data.items', 'items', 'data'));
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

  const categoryTabs = [
    { id: 'recent', label: 'Aktivitas Terbaru', count: bookings.length },
    { id: 'auth', label: CATEGORY_META.auth.label, count: categorizedLogs.auth.length },
    { id: 'booking', label: CATEGORY_META.booking.label, count: categorizedLogs.booking.length },
    { id: 'facility', label: CATEGORY_META.facility.label, count: categorizedLogs.facility.length },
    { id: 'system', label: CATEGORY_META.system.label, count: categorizedLogs.system.length },
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
