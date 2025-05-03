'use client';
import { useState, useEffect, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { th } from 'date-fns/locale';
import { Plus, Settings, Edit, Trash2, X, Check, Loader2 } from 'lucide-react';

const supabase = createClient(
  'https://xvlekplhzjkvhkweuffa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bGVrcGxoemprdmhrd2V1ZmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDg1NTksImV4cCI6MjA2MTUyNDU1OX0.TTTsQ_K3Iww6QJh_0fByYmNUKdsJX2H6hEQiKeCHq7M'
);

const theme = createTheme({
  typography: { fontFamily: 'Poppins, sans-serif', fontSize: 14 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            borderRadius: '8px',
            fontSize: '14px',
            padding: '8px',
            backgroundColor: '#fff',
          },
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#d1d5db',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B21A8',
          },
          '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#6B21A8',
            borderWidth: '2px',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: 'none' },
        indicator: {
          backgroundColor: '#6B21A8',
          height: '3px',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '14px',
          fontWeight: 600,
          textTransform: 'none',
          color: '#6b7280',
          padding: '12px 16px',
          '&.Mui-selected': { color: '#6B21A8' },
          '&:hover': { color: '#6B21A8', backgroundColor: '#f3f4f6' },
        },
      },
    },
  },
});

// TabPanel Component
const TabPanel = memo(({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index} id={`tabpanel-${index}`}>
    {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
  </div>
));

// Loading Spinner Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center">
    <Loader2 className="animate-spin text-purple-600" size={24} />
  </div>
);

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
  const [newRoomCategory, setNewRoomCategory] = useState('upper');
  const [rates, setRates] = useState({ electricity: 4, water: 15 });
  const [readings, setReadings] = useState({});
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [roomHistory, setRoomHistory] = useState({});
  const [editingRecord, setEditingRecord] = useState(null);
  const [editRecordValue, setEditRecordValue] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState({});
  const [calculationMonths, setCalculationMonths] = useState({});
  const [calculationResult, setCalculationResult] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [calculationMode, setCalculationMode] = useState('range');
  const [isLoading, setIsLoading] = useState(false);

  // Fetch rooms, rates, and history
  useEffect(() => {
    fetchRooms();
    fetchRates();
  }, []);

  async function fetchRooms() {
    setIsLoading(true);
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) {
      toast.error('ไม่สามารถโหลดข้อมูลห้องได้', { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }
    setRooms(data || []);
    if (data) {
      data.forEach((room) => fetchRoomHistory(room.id));
    }
    setIsLoading(false);
  }

  async function fetchRates() {
    const { data, error } = await supabase.from('rates').select('*').single();
    if (error) {
      toast.error('ไม่สามารถโหลดอัตราบริการได้', { icon: <X size={16} /> });
      return;
    }
    if (data) setRates(data);
  }

  async function fetchRoomHistory(roomId) {
    const { data, error } = await supabase
      .from('readings')
      .select('id, type, value, month, usage, cost')
      .eq('room_id', roomId)
      .order('month', { ascending: false });
    if (error) {
      toast.error('ไม่สามารถโหลดประวัติการบันทึกได้', { icon: <X size={16} /> });
      return;
    }
    setRoomHistory((prev) => ({ ...prev, [roomId]: data || [] }));
  }

  // Add new room
  async function addRoom() {
    if (!newRoom) {
      toast.error('กรุณากรอกชื่อห้อง', { icon: <X size={16} /> });
      return;
    }
    if (!newRoomCategory) {
      toast.error('กรุณาเลือกหมวดหมู่ห้อง', { icon: <X size={16} /> });
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: newRoom, category: newRoomCategory })
      .select();
    if (error) {
      toast.error('ไม่สามารถเพิ่มห้องได้', { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }
    setRooms([...rooms, data[0]]);
    setNewRoom('');
    setNewRoomCategory('upper');
    setShowAddRoomModal(false);
    fetchRoomHistory(data[0].id);
    toast.success(`เพิ่มห้อง ${data[0].name} สำเร็จ`, { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Update room name
  async function updateRoom(roomId, newName) {
    if (!newName) {
      toast.error('กรุณากรอกชื่อห้อง', { icon: <X size={16} /> });
      return;
    }
    setIsLoading(true);
    const { data, error } = await supabase
      .from('rooms')
      .update({ name: newName })
      .eq('id', roomId)
      .select();
    if (error) {
      toast.error('ไม่สามารถแก้ไขชื่อห้องได้', { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }
    setRooms(rooms.map((room) => (room.id === roomId ? data[0] : room)));
    setEditingRoom(null);
    setEditRoomName('');
    toast.success(`แก้ไขชื่อห้องเป็น ${newName} สำเร็จ`, { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Delete room and associated readings
  async function deleteRoom(roomId) {
    setIsLoading(true);
    const { error: readingsError } = await supabase.from('readings').delete().eq('room_id', roomId);
    const { error: roomError } = await supabase.from('rooms').delete().eq('id', roomId);
    if (readingsError || roomError) {
      toast.error('ไม่สามารถลบห้องได้', { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }
    const deletedRoom = rooms.find((room) => room.id === roomId);
    setRooms(rooms.filter((room) => room.id !== roomId));
    setRoomHistory((prev) => {
      const updatedHistory = { ...prev };
      delete updatedHistory[roomId];
      return updatedHistory;
    });
    setSelectedRoom(null);
    setEditingRoom(null);
    setDeleteConfirm(null);
    toast.success(`ลบห้อง ${deletedRoom.name} สำเร็จ`, { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Update rates
  async function updateRates(newRates) {
    setIsLoading(true);
    const { error } = await supabase
      .from('rates')
      .upsert({ id: 1, ...newRates });
    if (error) {
      toast.error('ไม่สามารถบันทึกอัตราบริการได้', { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }
    setRates(newRates);
    setShowRatesModal(false);
    toast.success('บันทึกอัตราบริการสำเร็จ', { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Record meter reading
  async function recordReading(roomId, type, value, month) {
    if (!value || value < 0) {
      toast.error(`กรุณากรอกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ที่ถูกต้อง`, { icon: <X size={16} /> });
      return;
    }
    setIsLoading(true);
    const { data: prevReading } = await supabase
      .from('readings')
      .select('value')
      .eq('room_id', roomId)
      .eq('type', type)
      .eq('month', getPreviousMonth(month))
      .single();

    const prevValue = prevReading?.value || 0;
    const usage = value - prevValue;
    const cost = usage * (type === 'electricity' ? rates.electricity : rates.water);

    const { error } = await supabase
      .from('readings')
      .insert({
        room_id: roomId,
        type,
        value,
        month,
        usage,
        cost,
      });

    if (error) {
      toast.error(`ไม่สามารถบันทึกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ได้`, { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }

    fetchRoomHistory(roomId);
    setSelectedRoom(null);
    setSelectedMonth((prev) => ({ ...prev, [roomId]: null }));
    toast.success(`บันทึกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}สำเร็จ`, { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Update meter reading
  async function updateReading(recordId, roomId, type, newValue, month) {
    if (!newValue || newValue < 0) {
      toast.error(`กรุณากรอกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ที่ถูกต้อง`, { icon: <X size={16} /> });
      return;
    }
    setIsLoading(true);
    const { data: prevReading } = await supabase
      .from('readings')
      .select('value')
      .eq('room_id', roomId)
      .eq('type', type)
      .eq('month', getPreviousMonth(month))
      .single();

    const prevValue = prevReading?.value || 0;
    const usage = newValue - prevValue;
    const cost = usage * (type === 'electricity' ? rates.electricity : rates.water);

    const { error } = await supabase
      .from('readings')
      .update({
        value: newValue,
        usage,
        cost,
      })
      .eq('id', recordId);

    if (error) {
      toast.error(`ไม่สามารถแก้ไขหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ได้`, { icon: <X size={16} /> });
      setIsLoading(false);
      return;
    }

    const nextMonth = getNextMonth(month);
    const { data: nextReading } = await supabase
      .from('readings')
      .select('id, value')
      .eq('room_id', roomId)
      .eq('type', type)
      .eq('month', nextMonth)
      .single();

    if (nextReading) {
      const nextUsage = nextReading.value - newValue;
      const nextCost = nextUsage * (type === 'electricity' ? rates.electricity : rates.water);
      const { error: nextError } = await supabase
        .from('readings')
        .update({
          usage: nextUsage,
          cost: nextCost,
        })
        .eq('id', nextReading.id);
      if (nextError) {
        toast.error('ไม่สามารถอัปเดตหน่วยเดือนถัดไปได้', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }
    }

    fetchRoomHistory(roomId);
    setEditingRecord(null);
    setEditRecordValue('');
    toast.success(`แก้ไขหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}สำเร็จ`, { icon: <Check size={16} /> });
    setIsLoading(false);
  }

  // Calculate usage and cost
  async function calculateUsageAndCost(roomId) {
    const months = calculationMonths[roomId] || {};
    setIsLoading(true);
    if (calculationMode === 'single') {
      const selectedMonth = months.singleMonth;
      if (!selectedMonth) {
        toast.error('กรุณาเลือกเดือน', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }
      const monthStr = formatDateToMonthYear(selectedMonth);
      const prevMonthStr = getPreviousMonth(monthStr);

      const { data: currentReadings, error: currentError } = await supabase
        .from('readings')
        .select('type, value')
        .eq('room_id', roomId)
        .eq('month', monthStr);

      const { data: prevReadings, error: prevError } = await supabase
        .from('readings')
        .select('type, value')
        .eq('room_id', roomId)
        .eq('month', prevMonthStr);

      if (currentError || prevError) {
        toast.error('ไม่สามารถดึงข้อมูลหน่วยได้', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      if (!currentReadings?.length) {
        toast.error('ไม่มีข้อมูลหน่วยสำหรับเดือนที่เลือก', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      const result = {
        electricity: { usage: 0, cost: 0 },
        water: { usage: 0, cost: 0 },
        firstMonth: formatThaiMonth(monthStr),
        secondMonth: null,
      };

      const currentElectricity = currentReadings.find((r) => r.type === 'electricity')?.value || 0;
      const currentWater = currentReadings.find((r) => r.type === 'water')?.value || 0;
      const prevElectricity = prevReadings?.find((r) => r.type === 'electricity')?.value || 0;
      const prevWater = prevReadings?.find((r) => r.type === 'water')?.value || 0;

      result.electricity.usage = currentElectricity - prevElectricity;
      result.electricity.cost = result.electricity.usage * rates.electricity;
      result.water.usage = currentWater - prevWater;
      result.water.cost = result.water.usage * rates.water;

      setCalculationResult(result);
      toast.success('คำนวณค่าใช้จ่ายสำเร็จ', { icon: <Check size={16} /> });
      setIsLoading(false);
    } else {
      const firstMonth = months.firstMonth;
      const secondMonth = months.secondMonth;

      if (!firstMonth || !secondMonth) {
        toast.error('กรุณาเลือกทั้งสองเดือน', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      const firstMonthStr = formatDateToMonthYear(firstMonth);
      const secondMonthStr = formatDateToMonthYear(secondMonth);

      if (firstMonthStr >= secondMonthStr) {
        toast.error('เดือนที่สองต้องมากกว่าเดือนแรก', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      const { data: firstReadings, error: firstError } = await supabase
        .from('readings')
        .select('type, value')
        .eq('room_id', roomId)
        .eq('month', firstMonthStr);

      const { data: secondReadings, error: secondError } = await supabase
        .from('readings')
        .select('type, value')
        .eq('room_id', roomId)
        .eq('month', secondMonthStr);

      if (firstError || secondError) {
        toast.error('ไม่สามารถดึงข้อมูลหน่วยได้', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      if (!firstReadings?.length || !secondReadings?.length) {
        toast.error('ไม่มีข้อมูลหน่วยสำหรับเดือนที่เลือก', { icon: <X size={16} /> });
        setIsLoading(false);
        return;
      }

      const result = {
        electricity: { usage: 0, cost: 0 },
        water: { usage: 0, cost: 0 },
        firstMonth: formatThaiMonth(firstMonthStr),
        secondMonth: formatThaiMonth(secondMonthStr),
      };

      const firstElectricity = firstReadings.find((r) => r.type === 'electricity')?.value || 0;
      const firstWater = firstReadings.find((r) => r.type === 'water')?.value || 0;
      const secondElectricity = secondReadings.find((r) => r.type === 'electricity')?.value || 0;
      const secondWater = secondReadings.find((r) => r.type === 'water')?.value || 0;

      result.electricity.usage = secondElectricity - firstElectricity;
      result.electricity.cost = result.electricity.usage * rates.electricity;
      result.water.usage = secondWater - firstWater;
      result.water.cost = result.water.usage * rates.water;

      setCalculationResult(result);
      toast.success('คำนวณค่าใช้จ่ายสำเร็จ', { icon: <Check size={16} /> });
      setIsLoading(false);
    }
  }

  // Format month to Thai with Buddhist Era
  function formatThaiMonth(month) {
    const [year, monthNum] = month.split('-');
    const thaiMonths = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    return `${thaiMonths[parseInt(monthNum) - 1]} ${parseInt(year) + 543}`;
  }

  // Get previous month
  function getPreviousMonth(currentMonth) {
    const [year, month] = currentMonth.split('-');
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() - 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Get next month
  function getNextMonth(currentMonth) {
    const [year, month] = currentMonth.split('-');
    const date = new Date(year, month - 1);
    date.setMonth(date.getMonth() + 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Format date to YYYY-MM
  function formatDateToMonthYear(date) {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  // Filter rooms by category
  const upperRooms = rooms.filter((room) => room.category === 'upper');
  const lowerRooms = rooms.filter((room) => room.category === 'lower');

  // Render room card
  const renderRoomCard = (room) => (
    <div
      key={room.id}
      className={`bg-white rounded-xl shadow-sm p-4 transition transform hover:scale-105 hover:shadow-md ${
        selectedRoom?.id === room.id ? 'border-2 border-purple-500' : ''
      }`}
    >
      {editingRoom?.id === room.id ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editRoomName}
            onChange={(e) => setEditRoomName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <button
              onClick={() => updateRoom(room.id, editRoomName)}
              className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? <LoadingSpinner /> : 'บันทึก'}
            </button>
            <button
              onClick={() => setEditingRoom(null)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition transform hover:scale-105"
              disabled={isLoading}
            >
              ยกเลิก
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-center">
            <h3
              onClick={() => setSelectedRoom(room)}
              className="text-base font-semibold text-gray-800 cursor-pointer hover:text-purple-600"
            >
              {room.name}
            </h3>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                room.category === 'upper' ? 'bg-purple-100 text-purple-600' : 'bg-teal-100 text-teal-600'
              }`}
            >
              {room.category === 'upper' ? 'ชั้นบน' : 'ชั้นล่าง'}
            </span>
          </div>
          <div className="flex justify-between mt-2">
            <p
              onClick={() => setSelectedRoom(room)}
              className="text-sm text-gray-500 cursor-pointer hover:text-gray-700"
            >
              แตะเพื่อบันทึกหน่วย
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingRoom(room);
                  setEditRoomName(room.name);
                }}
                className="text-purple-600 hover:text-purple-800"
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => setDeleteConfirm(room)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          {roomHistory[room.id]?.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-gray-600 mb-2">ประวัติการบันทึก</h4>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs text-gray-600 table-fixed">
                  <thead className="bg-gray-50 sticky top-0 z-10">
                    <tr>
                      <th className="py-2 px-3 text-left w-[40%]">เดือน</th>
                      <th className="py-2 px-3 text-left w-[20%]">ประเภท</th>
                      <th className="py-2 px-3 text-right w-[20%]">หน่วย</th>
                      <th className="py-2 px-3 text-right w-[20%]"></th>
                    </tr>
                  </thead>
                </table>
                <div className="max-h-50 overflow-y-auto">
                  <table className="w-full text-xs text-gray-600 table-fixed">
                    <tbody>
                      {roomHistory[room.id].map((record, index) => (
                        <tr
                          key={record.id}
                          className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100`}
                        >
                          {editingRecord?.id === record.id ? (
                            <td colSpan={4} className="py-2 px-3">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={editRecordValue}
                                  onChange={(e) => setEditRecordValue(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                                <button
                                  onClick={() =>
                                    updateReading(
                                      record.id,
                                      room.id,
                                      record.type,
                                      parseFloat(editRecordValue),
                                      record.month
                                    )
                                  }
                                  className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700"
                                  disabled={isLoading}
                                >
                                  {isLoading ? <LoadingSpinner /> : <Check size={16} />}
                                </button>
                                <button
                                  onClick={() => setEditingRecord(null)}
                                  className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700"
                                  disabled={isLoading}
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </td>
                          ) : (
                            <>
                              <td className="py-2 px-3 w-[40%]">{formatThaiMonth(record.month)}</td>
                              <td className="py-2 px-3 w-[20%]">
                                <span
                                  className={`flex items-center gap-1 ${
                                    record.type === 'electricity' ? 'text-yellow-600' : 'text-blue-600'
                                  }`}
                                >
                                  {record.type === 'electricity' ? '⚡️ไฟ' : '💧น้ำ'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right w-[20%]">
                                {record.value.toFixed(2)}
                              </td>
                              <td className="py-2 px-3 text-right w-[20%]">
                                <button
                                  onClick={() => {
                                    setEditingRecord(record);
                                    setEditRecordValue(record.value.toString());
                                  }}
                                  className="text-purple-600 hover:text-purple-800"
                                >
                                  <Edit size={16} />
                                </button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          {selectedRoom?.id === room.id && (
            <div className="mt-4 bg-white rounded-xl shadow-inner p-4">
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                centered
                sx={{ mb: 2 }}
              >
                <Tab label="บันทึกหน่วย" />
                <Tab label="คำนวณค่าใช้จ่าย" />
              </Tabs>
              <TabPanel value={tabValue} index={0}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">หน่วยไฟฟ้า</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="หน่วยไฟฟ้า"
                      value={readings[room.id]?.electricity || ''}
                      onChange={(e) =>
                        setReadings({
                          ...readings,
                          [room.id]: {
                            ...readings[room.id],
                            electricity: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">หน่วยน้ำ</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="หน่วยน้ำ"
                      value={readings[room.id]?.water || ''}
                      onChange={(e) =>
                        setReadings({
                          ...readings,
                          [room.id]: {
                            ...readings[room.id],
                            water: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">เดือน</label>
                    <DatePicker
                      value={selectedMonth[room.id] || null}
                      onChange={(date) => setSelectedMonth({ ...selectedMonth, [room.id]: date })}
                      views={['month', 'year']}
                      format="MMMM yyyy"
                      slotProps={{
                        textField: {
                          placeholder: 'เลือกเดือน',
                          size: 'small',
                          fullWidth: true,
                          sx: {
                            '& .MuiInputBase-root': {
                              fontSize: '14px',
                              padding: '8px',
                            },
                          },
                        },
                        popper: {
                          placement: 'top-start',
                          modifiers: [
                            {
                              name: 'preventOverflow',
                              options: {
                                rootBoundary: 'viewport',
                                tether: false,
                                altAxis: true,
                              },
                            },
                          ],
                        },
                      }}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        const month = formatDateToMonthYear(selectedMonth[room.id] || new Date());
                        if (readings[room.id]?.electricity) {
                          recordReading(
                            room.id,
                            'electricity',
                            parseFloat(readings[room.id].electricity),
                            month
                          );
                        }
                        if (readings[room.id]?.water) {
                          recordReading(room.id, 'water', parseFloat(readings[room.id].water), month);
                        }
                      }}
                      className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner /> : 'บันทึกหน่วย'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedRoom(null);
                        setSelectedMonth((prev) => ({ ...prev, [room.id]: null }));
                        setCalculationMonths((prev) => ({ ...prev, [room.id]: null }));
                        setCalculationResult(null);
                        setTabValue(0);
                      }}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition transform hover:scale-105"
                      disabled={isLoading}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </TabPanel>
              <TabPanel value={tabValue} index={1}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">โหมดการคำนวณ</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="calculationMode"
                          value="single"
                          checked={calculationMode === 'single'}
                          onChange={() => setCalculationMode('single')}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">คำนวณเดือนเดียว</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="calculationMode"
                          value="range"
                          checked={calculationMode === 'range'}
                          onChange={() => setCalculationMode('range')}
                          className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-700">คำนวณช่วงเดือน</span>
                      </label>
                    </div>
                  </div>
                  {calculationMode === 'single' ? (
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">เดือน</label>
                      <DatePicker
                        value={calculationMonths[room.id]?.singleMonth || null}
                        onChange={(date) =>
                          setCalculationMonths({
                            ...calculationMonths,
                            [room.id]: {
                              ...calculationMonths[room.id],
                              singleMonth: date,
                            },
                          })
                        }
                        views={['month', 'year']}
                        format="MMMM yyyy"
                        slotProps={{
                          textField: {
                            placeholder: 'เลือกเดือน',
                            size: 'small',
                            fullWidth: true,
                            sx: {
                              '& .MuiInputBase-root': {
                                fontSize: '14px',
                                padding: '8px',
                              },
                            },
                          },
                          popper: {
                            placement: 'top-start',
                            modifiers: [
                              {
                                name: 'preventOverflow',
                                options: {
                                  rootBoundary: 'viewport',
                                  tether: false,
                                  altAxis: true,
                                },
                              },
                            ],
                          },
                        }}
                      />
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">เดือนแรก</label>
                        <DatePicker
                          value={calculationMonths[room.id]?.firstMonth || null}
                          onChange={(date) =>
                            setCalculationMonths({
                              ...calculationMonths,
                              [room.id]: {
                                ...calculationMonths[room.id],
                                firstMonth: date,
                              },
                            })
                          }
                          views={['month', 'year']}
                          format="MMMM yyyy"
                          slotProps={{
                            textField: {
                              placeholder: 'เลือกเดือนแรก',
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                '& .MuiInputBase-root': {
                                  fontSize: '14px',
                                  padding: '8px',
                                },
                              },
                            },
                            popper: {
                              placement: 'top-start',
                              modifiers: [
                                {
                                  name: 'preventOverflow',
                                  options: {
                                    rootBoundary: 'viewport',
                                    tether: false,
                                    altAxis: true,
                                  },
                                },
                              ],
                            },
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">เดือนที่สอง</label>
                        <DatePicker
                          value={calculationMonths[room.id]?.secondMonth || null}
                          onChange={(date) =>
                            setCalculationMonths({
                              ...calculationMonths,
                              [room.id]: {
                                ...calculationMonths[room.id],
                                secondMonth: date,
                              },
                            })
                          }
                          views={['month', 'year']}
                          format="MMMM yyyy"
                          slotProps={{
                            textField: {
                              placeholder: 'เลือกเดือนที่สอง',
                              size: 'small',
                              fullWidth: true,
                              sx: {
                                '& .MuiInputBase-root': {
                                  fontSize: '14px',
                                  padding: '8px',
                                },
                              },
                            },
                            popper: {
                              placement: 'top-start',
                              modifiers: [
                                {
                                  name: 'preventOverflow',
                                  options: {
                                    rootBoundary: 'viewport',
                                    tether: false,
                                    altAxis: true,
                                  },
                                },
                              ],
                            },
                          }}
                        />
                      </div>
                    </>
                  )}
                  <button
                    onClick={() => calculateUsageAndCost(room.id)}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition transform hover:scale-105"
                    disabled={isLoading}
                  >
                    {isLoading ? <LoadingSpinner /> : 'คำนวณ'}
                  </button>
                  {calculationResult && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="text-sm font-semibold text-gray-600 mb-2">
                        ผลลัพธ์:{' '}
                        {calculationMode === 'single'
                          ? calculationResult.firstMonth
                          : `${calculationResult.firstMonth} ถึง ${calculationResult.secondMonth}`}
                      </h4>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-700">
                          <span className="text-yellow-600">⚡️ ไฟฟ้า:</span> ใช้{' '}
                          {calculationResult.electricity.usage.toFixed(2)} หน่วย, ค่าใช้จ่าย{' '}
                          {calculationResult.electricity.cost.toFixed(2)} บาท
                        </p>
                        <p className="text-sm text-gray-700">
                          <span className="text-blue-600">💧 น้ำ:</span> ใช้{' '}
                          {calculationResult.water.usage.toFixed(2)} หน่วย, ค่าใช้จ่าย{' '}
                          {calculationResult.water.cost.toFixed(2)} บาท
                        </p>
                        <p className="text-sm text-gray-700 font-semibold">
                          <span className="text-green-600">💸 รวมทั้งหมด:</span>{' '}
                          {(calculationResult.electricity.cost + calculationResult.water.cost).toFixed(2)}{' '}
                          บาท
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </TabPanel>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <div className="min-h-screen bg-gray-100 font-poppins">
          <Toaster
            position="bottom-center"
            toastOptions={{
              style: {
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              },
              success: {
                style: {
                  background: '#10B981',
                  color: '#fff',
                },
              },
              error: {
                style: {
                  background: '#EF4444',
                  color: '#fff',
                },
              },
            }}
          />
          <header className="bg-gradient-to-r from-purple-600 to-teal-500 text-white py-6 shadow-md">
            <h1 className="text-2xl font-bold text-center">ระบบคิดค่าไฟและค่าน้ำ</h1>
          </header>
          <div className="container mx-auto p-4">
            <div className="flex justify-between mb-6">
              <button
                onClick={() => setShowAddRoomModal(true)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
                disabled={isLoading}
              >
                <Plus size={16} /> เพิ่มห้อง
              </button>
              <button
                onClick={() => setShowRatesModal(true)}
                className="flex items-center gap-2 bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition transform hover:scale-105"
                disabled={isLoading}
              >
                <Settings size={16} /> กำหนดหน่วย
              </button>
            </div>
            {showAddRoomModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-xl">
                  <button
                    onClick={() => {
                      setShowAddRoomModal(false);
                      setNewRoom('');
                      setNewRoomCategory('upper');
                    }}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">เพิ่มห้องใหม่</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ชื่อห้อง</label>
                      <input
                        type="text"
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        placeholder="เช่น ล่าง 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">หมวดหมู่</label>
                      <select
                        value={newRoomCategory}
                        onChange={(e) => setNewRoomCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        <option value="upper">ชั้นบน</option>
                        <option value="lower">ชั้นล่าง</option>
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={addRoom}
                        className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition transform hover:scale-105"
                        disabled={isLoading}
                      >
                        {isLoading ? <LoadingSpinner /> : 'บันทึก'}
                      </button>
                      <button
                        onClick={() => {
                          setShowAddRoomModal(false);
                          setNewRoom('');
                          setNewRoomCategory('upper');
                        }}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition transform hover:scale-105"
                        disabled={isLoading}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {showRatesModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-xl">
                  <button
                    onClick={() => setShowRatesModal(false)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">กำหนดราคาต่อหน่วย</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ค่าไฟ (บาท/หน่วย)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={rates.electricity}
                        onChange={(e) => setRates({ ...rates, electricity: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">ค่าน้ำ (บาท/หน่วย)</label>
                      <input
                        type="number"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={rates.water}
                        onChange={(e) => setRates({ ...rates, water: parseFloat(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => updateRates(rates)}
                        className="flex-1 bg-teal-500 text-white py-2 rounded-lg hover:bg-teal-600 transition transform hover:scale-105"
                        disabled={isLoading}
                      >
                        {isLoading ? <LoadingSpinner /> : 'บันทึก'}
                      </button>
                      <button
                        onClick={() => setShowRatesModal(false)}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition transform hover:scale-105"
                        disabled={isLoading}
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">เลือกห้อง</h2>
              {isLoading && <LoadingSpinner />}
              {upperRooms.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">ชั้นบน</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {upperRooms.map(renderRoomCard)}
                  </div>
                </div>
              )}
              {lowerRooms.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-700 mb-3">ชั้นล่าง</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {lowerRooms.map(renderRoomCard)}
                  </div>
                </div>
              )}
              {upperRooms.length === 0 && lowerRooms.length === 0 && !isLoading && (
                <p className="text-gray-500 text-center text-sm">ยังไม่มีห้อง กรุณาเพิ่มห้องใหม่</p>
              )}
            </div>
            {deleteConfirm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-xl p-6 w-full max-w-sm relative shadow-xl">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
                  >
                    <X size={20} />
                  </button>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">ยืนยันการลบห้อง {deleteConfirm.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    การลบห้องจะลบประวัติหน่วยไฟฟ้าและน้ำทั้งหมดของห้องนี้ด้วย คุณแน่ใจหรือไม่?
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => deleteRoom(deleteConfirm.id)}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition transform hover:scale-105"
                      disabled={isLoading}
                    >
                      {isLoading ? <LoadingSpinner /> : 'ลบ'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition transform hover:scale-105"
                      disabled={isLoading}
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}