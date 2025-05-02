'use client';
import { useState, useEffect, memo } from 'react';
import { createClient } from '@supabase/supabase-js';
import toast, { Toaster } from 'react-hot-toast';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import TextField from '@mui/material/TextField';
import { th } from 'date-fns/locale';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const supabase = createClient(
  'https://xvlekplhzjkvhkweuffa.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2bGVrcGxoemprdmhrd2V1ZmZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU5NDg1NTksImV4cCI6MjA2MTUyNDU1OX0.TTTsQ_K3Iww6QJh_0fByYmNUKdsJX2H6hEQiKeCHq7M'
);

const theme = createTheme({
  typography: { fontSize: 16 },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: { '& .MuiInputBase-root': { borderRadius: '8px' } },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: { borderBottom: '1px solid #e5e7eb' },
        indicator: { backgroundColor: '#7c3aed' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: '16px',
          fontWeight: 500,
          textTransform: 'none',
          '&.Mui-selected': { color: '#7c3aed' },
        },
      },
    },
  },
});

// TabPanel Component
const TabPanel = memo(({ children, value, index }) => (
  <div role="tabpanel" hidden={value !== index}>
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
));

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [newRoom, setNewRoom] = useState('');
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

  // Fetch rooms, rates, and history
  useEffect(() => {
    fetchRooms();
    fetchRates();
  }, []);

  async function fetchRooms() {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) {
      toast.error('ไม่สามารถโหลดข้อมูลห้องได้');
      return;
    }
    setRooms(data || []);
    if (data) {
      data.forEach((room) => fetchRoomHistory(room.id));
    }
  }

  async function fetchRates() {
    const { data, error } = await supabase.from('rates').select('*').single();
    if (error) {
      toast.error('ไม่สามารถโหลดอัตราบริการได้');
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
      toast.error('ไม่สามารถโหลดประวัติการบันทึกได้');
      return;
    }
    setRoomHistory((prev) => ({ ...prev, [roomId]: data || [] }));
  }

  // Add new room
  async function addRoom() {
    if (!newRoom) {
      toast.error('กรุณากรอกชื่อห้อง');
      return;
    }
    const { data, error } = await supabase
      .from('rooms')
      .insert({ name: newRoom })
      .select();
    if (error) {
      toast.error('ไม่สามารถเพิ่มห้องได้');
      return;
    }
    setRooms([...rooms, data[0]]);
    setNewRoom('');
    setShowAddRoomModal(false);
    fetchRoomHistory(data[0].id);
    toast.success(`เพิ่มห้อง ${data[0].name} สำเร็จ`);
  }

  // Update room name
  async function updateRoom(roomId, newName) {
    if (!newName) {
      toast.error('กรุณากรอกชื่อห้อง');
      return;
    }
    const { data, error } = await supabase
      .from('rooms')
      .update({ name: newName })
      .eq('id', roomId)
      .select();
    if (error) {
      toast.error('ไม่สามารถแก้ไขชื่อห้องได้');
      return;
    }
    setRooms(rooms.map((room) => (room.id === roomId ? data[0] : room)));
    setEditingRoom(null);
    setEditRoomName('');
    toast.success(`แก้ไขชื่อห้องเป็น ${newName} สำเร็จ`);
  }

  // Delete room and associated readings
  async function deleteRoom(roomId) {
    const { error: readingsError } = await supabase.from('readings').delete().eq('room_id', roomId);
    const { error: roomError } = await supabase.from('rooms').delete().eq('id', roomId);
    if (readingsError || roomError) {
      toast.error('ไม่สามารถลบห้องได้');
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
    toast.success(`ลบห้อง ${deletedRoom.name} สำเร็จ`);
  }

  // Update rates
  async function updateRates(newRates) {
    const { error } = await supabase
      .from('rates')
      .upsert({ id: 1, ...newRates });
    if (error) {
      toast.error('ไม่สามารถบันทึกอัตราบริการได้');
      return;
    }
    setRates(newRates);
    setShowRatesModal(false);
    toast.success('บันทึกอัตราบริการสำเร็จ');
  }

  // Record meter reading
  async function recordReading(roomId, type, value, month) {
    if (!value || value < 0) {
      toast.error(`กรุณากรอกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ที่ถูกต้อง`);
      return;
    }
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
        cost
      });

    if (error) {
      toast.error(`ไม่สามารถบันทึกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ได้`);
      return;
    }

    fetchRoomHistory(roomId);
    setSelectedRoom(null);
    setSelectedMonth((prev) => ({ ...prev, [roomId]: null }));
    toast.success(`บันทึกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}สำเร็จ`);
  }

  // Update meter reading
  async function updateReading(recordId, roomId, type, newValue, month) {
    if (!newValue || newValue < 0) {
      toast.error(`กรุณากรอกหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ที่ถูกต้อง`);
      return;
    }
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
        cost
      })
      .eq('id', recordId);

    if (error) {
      toast.error(`ไม่สามารถแก้ไขหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}ได้`);
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
          cost: nextCost
        })
        .eq('id', nextReading.id);
      if (nextError) {
        toast.error('ไม่สามารถอัปเดตหน่วยเดือนถัดไปได้');
        return;
      }
    }

    fetchRoomHistory(roomId);
    setEditingRecord(null);
    setEditRecordValue('');
    toast.success(`แก้ไขหน่วย${type === 'electricity' ? 'ไฟฟ้า' : 'น้ำ'}สำเร็จ`);
  }

  // Calculate usage and cost between two months
  async function calculateUsageAndCost(roomId) {
    const months = calculationMonths[roomId] || {};
    const firstMonth = months.firstMonth;
    const secondMonth = months.secondMonth;

    if (!firstMonth || !secondMonth) {
      toast.error('กรุณาเลือกทั้งสองเดือน');
      return;
    }

    const firstMonthStr = formatDateToMonthYear(firstMonth);
    const secondMonthStr = formatDateToMonthYear(secondMonth);

    if (firstMonthStr >= secondMonthStr) {
      toast.error('เดือนที่สองต้องมากกว่าเดือนแรก');
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
      toast.error('ไม่สามารถดึงข้อมูลหน่วยได้');
      return;
    }

    if (!firstReadings?.length || !secondReadings?.length) {
      toast.error('ไม่มีข้อมูลหน่วยสำหรับเดือนที่เลือก');
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
    toast.success('คำนวณค่าใช้จ่ายสำเร็จ');
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
      'ธันวาคม'
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

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={th}>
        <div className="container mx-auto p-3 sm:p-4 bg-gray-100 min-h-screen">
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '8px',
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
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-gray-800">
            ระบบคิดค่าไฟและค่าน้ำ
          </h1>

          {/* Add Room and Set Rates Buttons */}
          <div className="flex justify-between mb-4 sm:mb-6">
            <button
              onClick={() => setShowAddRoomModal(true)}
              className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition"
              title="เพิ่มห้องใหม่"
            >
              +
            </button>
            <button
              onClick={() => setShowRatesModal(true)}
              className="bg-green-600 text-white p-2 rounded-full hover:bg-green-700 transition"
              title="กำหนดราคาต่อหน่วย"
            >
              🛠️
            </button>
          </div>

          {/* Add Room Modal */}
          {showAddRoomModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-xs">
                <h3 className="text-base font-semibold text-gray-800 mb-3">เพิ่มห้องใหม่</h3>
                <input
                  type="text"
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="ชื่อห้อง (เช่น ห้อง 101)"
                  className="border border-gray-300 rounded-md p-2 w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-3">
                  <button
                    onClick={addRoom}
                    className="bg-blue-600 text-white p-2 rounded-md flex-1 hover:bg-blue-700 transition"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() => {
                      setShowAddRoomModal(false);
                      setNewRoom('');
                    }}
                    className="bg-gray-300 text-gray-800 p-2 rounded-md flex-1 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Set Rates Modal */}
          {showRatesModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-xs">
                <h3 className="text-base font-semibold text-gray-800 mb-3">กำหนดราคาต่อหน่วย</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-600 text-sm">ค่าไฟ (บาท/หน่วย):</label>
                    <input
                      type="number"
                      value={rates.electricity}
                      onChange={(e) => setRates({ ...rates, electricity: parseFloat(e.target.value) || 0 })}
                      className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600 text-sm">ค่าน้ำ (บาท/หน่วย):</label>
                    <input
                      type="number"
                      value={rates.water}
                      onChange={(e) => setRates({ ...rates, water: parseFloat(e.target.value) || 0 })}
                      className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => updateRates(rates)}
                    className="bg-green-600 text-white p-2 rounded-md flex-1 hover:bg-green-700 transition"
                  >
                    บันทึก
                  </button>
                  <button
                    onClick={() => setShowRatesModal(false)}
                    className="bg-gray-300 text-gray-800 p-2 rounded-md flex-1 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Room Selection */}
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 text-gray-700">เลือกห้อง</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`bg-white rounded-lg shadow-md p-3 transition transform hover:scale-105 ${
                    selectedRoom?.id === room.id ? 'border-2 border-purple-500' : ''
                  }`}
                >
                  {editingRoom?.id === room.id ? (
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <input
                        type="text"
                        value={editRoomName}
                        onChange={(e) => setEditRoomName(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                        <button
                          onClick={() => updateRoom(room.id, editRoomName)}
                          className="bg-green-600 text-white p-2 rounded-md flex-1 hover:bg-green-700"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingRoom(null)}
                          className="bg-red-600 text-white p-2 rounded-md flex-1 hover:bg-red-700"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <h3
                        onClick={() => setSelectedRoom(room)}
                        className="text-base font-semibold text-gray-800 cursor-pointer hover:text-gray-600"
                      >
                        {room.name}
                      </h3>
                      <div className="flex justify-between mt-2">
                        <p
                          onClick={() => setSelectedRoom(room)}
                          className="text-gray-500 text-sm cursor-pointer hover:text-gray-700"
                        >
                          แตะเพื่อบันทึกหน่วย
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingRoom(room);
                              setEditRoomName(room.name);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(room)}
                            className="text-red-600 hover:text-red-800"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      {/* Room History */}
                      {roomHistory[room.id]?.length > 0 && (
                        <div className="mt-3">
                          <h4 className="text-sm font-semibold text-gray-600 mb-2">ประวัติการบันทึก</h4>
                          <div className="border border-gray-200 rounded-lg">
                            <table className="w-full text-xs text-gray-600 table-fixed">
                              <thead className="bg-gray-100 shadow-sm">
                                <tr>
                                  <th className="py-2 px-2 text-left w-[30%] sticky top-0 bg-gray-100 z-10">เดือน</th>
                                  <th className="py-2 px-2 text-left w-[20%] sticky top-0 bg-gray-100 z-10">ประเภท</th>
                                  <th className="py-2 px-2 text-right w-[30%] sticky top-0 bg-gray-100 z-10">หน่วย</th>
                                  <th className="py-2 px-2 text-right w-[20%] sticky top-0 bg-gray-100 z-10"></th>
                                </tr>
                              </thead>
                            </table>
                            <div className="max-h-32 overflow-y-auto">
                              <table className="w-full text-xs text-gray-600 table-fixed">
                                <tbody>
                                  {roomHistory[room.id].map((record) => (
                                    <tr key={record.id} className="border-t hover:bg-gray-50">
                                      {editingRecord?.id === record.id ? (
                                        <td colSpan={4} className="py-2 px-2">
                                          <div className="flex flex-col sm:flex-row items-center gap-2">
                                            <input
                                              type="number"
                                              value={editRecordValue}
                                              onChange={(e) => setEditRecordValue(e.target.value)}
                                              className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <div className="flex gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
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
                                                className="bg-green-600 text-white p-2 rounded-md flex-1 hover:bg-green-700"
                                              >
                                                บันทึก
                                              </button>
                                              <button
                                                onClick={() => setEditingRecord(null)}
                                                className="bg-red-600 text-white p-2 rounded-md flex-1 hover:bg-red-700"
                                              >
                                                ยกเลิก
                                              </button>
                                            </div>
                                          </div>
                                        </td>
                                      ) : (
                                        <>
                                          <td className="py-2 px-2 w-[30%]">{formatThaiMonth(record.month)}</td>
                                          <td className="py-2 px-2 w-[20%]">
                                            <span
                                              className={`flex items-center gap-1 ${
                                                record.type === 'electricity' ? 'text-yellow-600' : 'text-blue-600'
                                              }`}
                                            >
                                              {record.type === 'electricity' ? '⚡️' : '💧'}
                                            </span>
                                          </td>
                                          <td className="py-2 px-2 text-right w-[30%]">{record.value.toFixed(2)}</td>
                                          <td className="py-2 px-2 text-right w-[20%]">
                                            <button
                                              onClick={() => {
                                                setEditingRecord(record);
                                                setEditRecordValue(record.value);
                                              }}
                                              className="text-blue-600 hover:text-blue-800"
                                            >
                                              ✏️
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
                      {/* Tabs for Selected Room */}
                      {selectedRoom?.id === room.id && (
                        <div className="mt-3 bg-white rounded-lg shadow-inner p-3">
                          <h2 className="text-base font-semibold mb-3 text-gray-700">
                            {room.name}
                          </h2>
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
                            <div className="space-y-3">
                              <div>
                                <label className="block text-gray-600 text-sm">หน่วยไฟฟ้า:</label>
                                <input
                                  type="number"
                                  placeholder="หน่วยไฟฟ้า"
                                  onChange={(e) =>
                                    setReadings({
                                      ...readings,
                                      [room.id]: {
                                        ...readings[room.id],
                                        electricity: parseFloat(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  className="border border-gray-300 rounded-md p-3 text-base w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-sm">หน่วยน้ำ:</label>
                                <input
                                  type="number"
                                  placeholder="หน่วยน้ำ"
                                  onChange={(e) =>
                                    setReadings({
                                      ...readings,
                                      [room.id]: {
                                        ...readings[room.id],
                                        water: parseFloat(e.target.value) || 0,
                                      },
                                    })
                                  }
                                  className="border border-gray-300 rounded-md p-3 text-base w-full focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                              </div>
                              <div>
                                <label className="block text-gray-600 text-sm">เดือน:</label>
                                <DatePicker
                                  value={selectedMonth[room.id] || null}
                                  onChange={(date) =>
                                    setSelectedMonth({ ...selectedMonth, [room.id]: date })
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
                              <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                  onClick={() => {
                                    const month = formatDateToMonthYear(selectedMonth[room.id] || new Date());
                                    if (readings[room.id]?.electricity) {
                                      recordReading(
                                        room.id,
                                        'electricity',
                                        readings[room.id].electricity,
                                        month
                                      );
                                    }
                                    if (readings[room.id]?.water) {
                                      recordReading(
                                        room.id,
                                        'water',
                                        readings[room.id].water,
                                        month
                                      );
                                    }
                                  }}
                                  className="bg-purple-600 text-white p-3 rounded-md w-full hover:bg-purple-700 transition"
                                >
                                  บันทึกหน่วย
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRoom(null);
                                    setSelectedMonth((prev) => ({ ...prev, [room.id]: null }));
                                    setCalculationMonths((prev) => ({ ...prev, [room.id]: null }));
                                    setCalculationResult(null);
                                    setTabValue(0);
                                  }}
                                  className="bg-red-600 text-white p-3 rounded-md w-full hover:bg-red-700 transition"
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          </TabPanel>
                          <TabPanel value={tabValue} index={1}>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-gray-600 text-sm">เดือนแรก:</label>
                                <DatePicker
                                  value={calculationMonths[room.id]?.firstMonth || null}
                                  onChange={(date) =>
                                    setCalculationMonths({
                                      ...calculationMonths,
                                      [room.id]: {
                                        firstMonth: date,
                                        secondMonth: calculationMonths[room.id]?.secondMonth || null,
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
                                <label className="block text-gray-600 text-sm">เดือนที่สอง:</label>
                                <DatePicker
                                  value={calculationMonths[room.id]?.secondMonth || null}
                                  onChange={(date) =>
                                    setCalculationMonths({
                                      ...calculationMonths,
                                      [room.id]: {
                                        firstMonth: calculationMonths[room.id]?.firstMonth || null,
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
                              <button
                                onClick={() => calculateUsageAndCost(room.id)}
                                className="bg-blue-600 text-white p-3 rounded-md w-full hover:bg-blue-700 transition"
                              >
                                คำนวณ
                              </button>
                              {calculationResult && (
                                <div className="bg-gray-50 p-3 rounded-md">
                                  <h4 className="text-sm font-semibold text-gray-600 mb-2">
                                    ผลลัพธ์: {calculationResult.firstMonth} ถึง {calculationResult.secondMonth}
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
                                      {(calculationResult.electricity.cost + calculationResult.water.cost).toFixed(2)} บาท
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
              ))}
            </div>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-4 w-full max-w-xs">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  ยืนยันการลบห้อง {deleteConfirm.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  การลบห้องจะลบประวัติหน่วยไฟฟ้าและน้ำทั้งหมดของห้องนี้ด้วย คุณแน่ใจหรือไม่?
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => deleteRoom(deleteConfirm.id)}
                    className="bg-red-600 text-white p-2 rounded-md flex-1 hover:bg-red-700 transition"
                  >
                    ลบ
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="bg-gray-300 text-gray-800 p-2 rounded-md flex-1 hover:bg-gray-400 transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </LocalizationProvider>
    </ThemeProvider>
  );
}