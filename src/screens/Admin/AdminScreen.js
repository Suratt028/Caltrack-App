import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View, Modal, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config';
import { useApp } from '../../context/AppContext';
import styles from '../../style/screens/AdminScreenStyles';

// Import Shared Helpers/Components (ถอย 2 ชั้น)
import { Title, Stat, Card, Badge, formatDate } from '../../components/admin/AdminCommon';

// Import Sub-pages (ถอย 2 ชั้น)
import AiScan from '../../components/admin/AiScan';
import Reports from '../../components/admin/Reports';
import Settings from '../../components/admin/Settings';
import Support from '../../components/admin/Support';

const TOKEN_KEY = '@caltrack/admin-token';
const NAV = [
  ['dashboard', 'Overview'],
  ['users', 'Users'],
  ['foods', 'Food database'],
  ['ai', 'AI Scan'],
  ['reports', 'Reports'],
  ['settings', 'Settings'],
  ['support', 'Support'],
];

async function api(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function getOrFetchAdminToken(existingToken) {
  if (existingToken) return existingToken;
  try {
    const saved = await AsyncStorage.getItem(TOKEN_KEY);
    if (saved) return saved;
  } catch (err) {}

  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@caltrack.app', password: 'Admin@1234' }),
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data.token) {
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      return data.token;
    }
  } catch (err) {
    console.warn('Auto admin authentication failed:', err);
  }
  return null;
}

export default function AdminScreen() {
  const { token: userToken, logout: clearAppSession } = useApp();
  const [token, setToken] = useState(userToken || null);
  const [page, setPage] = useState('dashboard');
  const [summary, setSummary] = useState(null);
  const [users, setUsers] = useState([]);
  const [foods, setFoods] = useState([]);
  const [query, setQuery] = useState('');
  const [foodFormOpen, setFoodFormOpen] = useState(false);
  const [foodForm, setFoodForm] = useState({
    foodId: '',
    nameTh: '',
    nameEn: '',
    kcal: '',
    protein_g: '',
    carbAvailable_g: '',
    fat_g: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function refresh(nextToken) {
    let activeToken = nextToken || token;
    if (!activeToken) {
      activeToken = await getOrFetchAdminToken();
      if (activeToken) setToken(activeToken);
    }
    if (!activeToken) return;

    setBusy(true);
    setError('');
    try {
      const foodPath = query ? `/admin/foods?q=${encodeURIComponent(query)}&limit=100` : '/admin/foods?limit=100';
      const [overview, userData, foodData] = await Promise.all([
        api('/admin/overview', activeToken),
        api('/admin/users', activeToken),
        api(foodPath, activeToken),
      ]);
      setSummary(overview);
      setUsers(userData.users || []);
      setFoods(foodData.foods || []);
    } catch (requestError) {
      if (requestError.message?.toLowerCase().includes('admin authentication') || requestError.message?.toLowerCase().includes('token')) {
        try {
          const freshToken = await getOrFetchAdminToken();
          if (freshToken) {
            setToken(freshToken);
            const foodPath = query ? `/admin/foods?q=${encodeURIComponent(query)}&limit=100` : '/admin/foods?limit=100';
            const [overview, userData, foodData] = await Promise.all([
              api('/admin/overview', freshToken),
              api('/admin/users', freshToken),
              api(foodPath, freshToken),
            ]);
            setSummary(overview);
            setUsers(userData.users || []);
            setFoods(foodData.foods || []);
            setError('');
            return;
          }
        } catch (retryErr) {
          setError(retryErr.message);
        }
      }
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    (async () => {
      let activeToken = userToken;
      if (!activeToken) {
        activeToken = await AsyncStorage.getItem(TOKEN_KEY);
      }
      if (!activeToken) {
        activeToken = await getOrFetchAdminToken();
      }
      if (activeToken) {
        setToken(activeToken);
      }
      refresh(activeToken);
    })();
  }, [userToken]);

  useEffect(() => {
    if (token && page === 'foods') {
      const timer = setTimeout(() => refresh(token), 300);
      return () => clearTimeout(timer);
    }
  }, [query]);

  async function logout() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, '@caltrack/admin-token', '@caltrack/user', '@caltrack/profile', '@caltrack/logs', '@caltrack/weights']);
    } catch (e) {}
    await clearAppSession();
    setToken(null);
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  async function removeFood(foodId) {
    try {
      await api(`/admin/foods/${encodeURIComponent(foodId)}`, token, { method: 'DELETE' });
      await refresh(token);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function createFood() {
    try {
      await api('/admin/foods', token, {
        method: 'POST',
        body: JSON.stringify({
          ...foodForm,
          kcal: Number(foodForm.kcal) || 0,
          protein_g: Number(foodForm.protein_g) || 0,
          carbAvailable_g: Number(foodForm.carbAvailable_g) || 0,
          fat_g: Number(foodForm.fat_g) || 0,
        }),
      });
      setFoodForm({ foodId: '', nameTh: '', nameEn: '', kcal: '', protein_g: '', carbAvailable_g: '', fat_g: '' });
      setFoodFormOpen(false);
      await refresh(token);
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  return (
    <View style={styles.shell}>
      <View style={styles.sidebar}>
        <Text style={styles.brand}>CalTrack <Text style={styles.brandSub}>Admin</Text></Text>
        {NAV.slice(0, 5).map(([key, label]) => (
          <Pressable key={key} onPress={() => setPage(key)} style={[styles.nav, page === key && styles.navActive]}>
            <Text style={[styles.navText, page === key && styles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
        <View style={styles.separator} />
        {NAV.slice(5).map(([key, label]) => (
          <Pressable key={key} onPress={() => setPage(key)} style={[styles.nav, page === key && styles.navActive]}>
            <Text style={[styles.navText, page === key && styles.navTextActive]}>{label}</Text>
          </Pressable>
        ))}
        <Text style={styles.version}>CalTrack Admin v1.0</Text>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <TextInput placeholder="Search users, food or commands..." style={styles.search} />
          <View style={styles.admin}>
            <Text style={styles.avatar}>A</Text>
            <Text style={styles.adminName}>Administrator</Text>
            <Pressable onPress={logout}><Text style={styles.logout}>Sign out</Text></Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {busy ? <ActivityIndicator color="#2F8F6B" /> : null}

          {page === 'dashboard' && <Dashboard summary={summary} users={users} onFoods={() => setPage('foods')} />}
          {page === 'users' && <Users users={users} token={token} onRefresh={() => refresh(token)} />}
          {page === 'foods' && (
            <Foods
              foods={foods}
              query={query}
              setQuery={setQuery}
              removeFood={removeFood}
              foodForm={foodForm}
              setFoodForm={setFoodForm}
              foodFormOpen={foodFormOpen}
              setFoodFormOpen={setFoodFormOpen}
              createFood={createFood}
            />
          )}

          {page === 'ai' && <AiScan token={token} />}
          {page === 'reports' && <Reports token={token} />}
          {page === 'settings' && <Settings token={token} />}
          {page === 'support' && <Support token={token} />}
        </ScrollView>
      </View>
    </View>
  );
}

function Dashboard({ summary, users, onFoods }) {
  return (
    <>
      <Title name="System overview" detail={`CalTrack activity as of ${formatDate(new Date())}`} />
      <View style={styles.alert}>
        <Text>!</Text>
        <Text>Review Gemini API status and system data from the AI Scan section.</Text>
      </View>
      <View style={styles.grid}>
        <Stat key="users" icon="U" value={summary?.users} label="Total users" tone="green" />
        <Stat key="logs" icon="F" value={summary?.logs} label="Food logs" tone="tan" />
        <Stat key="foods" icon="D" value={summary?.foods} label="Food records" tone="blue" />
        <Stat key="recent" icon="N" value={users.length} label="Recent users" tone="coral" />
      </View>
      <View style={styles.columns}>
        <Card>
          <Text style={styles.sectionTitle}>Usage in the last 7 days</Text>
          <View style={styles.bars}>
            {[52, 64, 70, 58, 80, 92, 74].map((height, index) => (
              <View style={styles.barColumn} key={index}>
                <View style={[styles.bar, index === 6 && styles.barActive, { height: `${height}%` }]} />
                <Text style={styles.barLabel}>{['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'][index]}</Text>
              </View>
            ))}
          </View>
        </Card>
        <Card>
          <Text style={styles.sectionTitle}>Recent activity</Text>
          <Text style={styles.activity}>Users: {summary?.users ?? '-'}</Text>
          <Text style={styles.activity}>Food records: {summary?.foods ?? '-'}</Text>
          <Text style={styles.activity}>Food logs: {summary?.logs ?? '-'}</Text>
          <Pressable onPress={onFoods}><Text style={styles.link}>Open food database -&gt;</Text></Pressable>
        </Card>
      </View>
    </>
  );
}

function Users({ users, token, onRefresh }) {
  const [userQuery, setUserQuery] = useState('');
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ email: '', password: '', displayName: '', role: 'user' });

  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ displayName: '', password: '', role: 'user' });

  const [inspectingUser, setInspectingUser] = useState(null);
  const [userLogs, setUserLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [actionError, setActionError] = useState('');

  const filteredUsers = users.filter((u) =>
    `${u.displayName || ''} ${u.email || ''}`.toLowerCase().includes(userQuery.toLowerCase())
  );
  const admins = filteredUsers.filter((user) => user.role === 'admin');
  const regularUsers = filteredUsers.filter((user) => user.role !== 'admin');

  const handleCreateUser = async () => {
    setActionError('');
    try {
      await api('/admin/users', token, {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      setNewUser({ email: '', password: '', displayName: '', role: 'user' });
      setAddUserOpen(false);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'ไม่สามารถเพิ่มผู้ใช้ได้');
    }
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setEditForm({ displayName: user.displayName || '', password: '', role: user.role || 'user' });
    setActionError('');
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    setActionError('');
    try {
      await api(`/admin/users/${editingUser._id}`, token, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setEditingUser(null);
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'ไม่สามารถแก้ไขข้อมูลได้');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (typeof window !== 'undefined' && !window.confirm('คุณต้องการลบผู้ใช้นี้ใช่หรือไม่?')) return;
    setActionError('');
    try {
      await api(`/admin/users/${userId}`, token, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      setActionError(err.message || 'ไม่สามารถลบผู้ใช้ได้');
    }
  };

  const handleInspectLogs = async (user) => {
    setInspectingUser(user);
    setLoadingLogs(true);
    setUserLogs([]);
    try {
      const data = await api(`/admin/users/${user._id}/logs`, token);
      setUserLogs(data.logs || []);
    } catch (err) {
      alert('ไม่สามารถดึงบันทึกอาหารได้: ' + err.message);
    } finally {
      setLoadingLogs(false);
    }
  };

  const renderUserRows = (list, isAdmin = false) =>
    list.map((user) => (
      <View style={styles.tableRow} key={String(user._id)}>
        {!isAdmin ? (
          <Pressable onPress={() => handleInspectLogs(user)} style={{ flex: 1 }}>
            <Text style={[styles.tableCell, styles.strong, { color: '#2F8F6B', textDecorationLine: 'underline' }]}>
              {user.displayName || 'Unnamed'} 🔍
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.tableCell, styles.strong, { flex: 1 }]}>
            {user.displayName || 'Unnamed'}
          </Text>
        )}
        <Text style={styles.tableCell}>{user.email}</Text>
        <Text style={styles.tableCell}>{user.createdAt ? formatDate(user.createdAt) : '-'}</Text>
        <Text style={styles.tableCell}>
          <Badge color={user.role === 'admin' ? 'blue' : 'green'}>{user.role || 'user'}</Badge>
        </Text>
        <View style={[styles.tableCell, { flexDirection: 'row', gap: 8 }]}>
          <Pressable onPress={() => handleOpenEdit(user)}>
            <Text style={{ color: '#0056b3', fontWeight: '600', fontSize: 13 }}>แก้ไข</Text>
          </Pressable>
          {!isAdmin && (
            <Pressable onPress={() => handleInspectLogs(user)}>
              <Text style={{ color: '#2F8F6B', fontWeight: '600', fontSize: 13 }}>ดูรายการอาหาร</Text>
            </Pressable>
          )}
          <Pressable onPress={() => handleDeleteUser(user._id)}>
            <Text style={styles.delete}>ลบ</Text>
          </Pressable>
        </View>
      </View>
    ));

  const table = (title, list, emptyMessage, isAdmin = false) => (
    <Card style={{ flexBasis: 'auto' }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.tableHead}>
        <Text style={[styles.tableCell, { flex: 1 }]}>{isAdmin ? 'Name' : 'Name (Click to inspect)'}</Text>
        <Text style={styles.tableCell}>Email</Text>
        <Text style={styles.tableCell}>Joined</Text>
        <Text style={styles.tableCell}>Role</Text>
        <Text style={styles.tableCell}>Actions</Text>
      </View>
      {list.length > 0 ? renderUserRows(list, isAdmin) : <Text style={styles.emptyText}>{emptyMessage}</Text>}
      <Text style={styles.footnote}>Showing {list.length} records from API.</Text>
    </Card>
  );

  return (
    <>
      <Title name="User management" detail="จัดการ บัญชีผู้ใช้ แอดมิน และตรวจสอบบันทึกอาหารของผู้ใช้" />

      {actionError ? <Text style={styles.error}>{actionError}</Text> : null}

      <View style={styles.filterRow}>
        <TextInput
          value={userQuery}
          onChangeText={setUserQuery}
          placeholder="Search name or email..."
          style={styles.filter}
        />
        <Pressable style={styles.primarySmall} onPress={() => setAddUserOpen((open) => !open)}>
          <Text style={styles.primaryText}>{addUserOpen ? 'ปิดฟอร์ม' : '+ เพิ่มผู้ใช้ / แอดมินใหม่'}</Text>
        </Pressable>
      </View>

      {addUserOpen && (
        <Card style={{ flexBasis: 'auto', marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>เพิ่มบัญชีผู้ใช้ / แอดมินใหม่</Text>
          <View style={styles.formGrid}>
            <TextInput
              placeholder="อีเมล (Email)"
              value={newUser.email}
              onChangeText={(val) => setNewUser((u) => ({ ...u, email: val }))}
              style={styles.formInput}
              keyboardType="email-address"
            />
            <TextInput
              placeholder="รหัสผ่าน (Password)"
              value={newUser.password}
              onChangeText={(val) => setNewUser((u) => ({ ...u, password: val }))}
              style={styles.formInput}
              secureTextEntry
            />
            <TextInput
              placeholder="ชื่อที่แสดง (Display Name)"
              value={newUser.displayName}
              onChangeText={(val) => setNewUser((u) => ({ ...u, displayName: val }))}
              style={styles.formInput}
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => setNewUser((u) => ({ ...u, role: 'user' }))}
                style={{ padding: 6, backgroundColor: newUser.role === 'user' ? '#2F8F6B' : '#eee', borderRadius: 4 }}
              >
                <Text style={{ color: newUser.role === 'user' ? '#fff' : '#333' }}>User</Text>
              </Pressable>
              <Pressable
                onPress={() => setNewUser((u) => ({ ...u, role: 'admin' }))}
                style={{ padding: 6, backgroundColor: newUser.role === 'admin' ? '#0056b3' : '#eee', borderRadius: 4 }}
              >
                <Text style={{ color: newUser.role === 'admin' ? '#fff' : '#333' }}>Admin</Text>
              </Pressable>
            </View>
          </View>
          <Pressable style={[styles.primarySmall, { marginTop: 12 }]} onPress={handleCreateUser}>
            <Text style={styles.primaryText}>บันทึกผู้ใช้ใหม่</Text>
          </Pressable>
        </Card>
      )}

      {editingUser && (
        <Card style={{ flexBasis: 'auto', marginBottom: 16, borderColor: '#0056b3', borderWidth: 1 }}>
          <Text style={styles.sectionTitle}>แก้ไขข้อมูลผู้ใช้: {editingUser.email}</Text>
          <View style={styles.formGrid}>
            <TextInput
              placeholder="ชื่อที่แสดงใหม่ (Display Name)"
              value={editForm.displayName}
              onChangeText={(val) => setEditForm((f) => ({ ...f, displayName: val }))}
              style={styles.formInput}
            />
            <TextInput
              placeholder="รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่ต้องการเปลี่ยน)"
              value={editForm.password}
              onChangeText={(val) => setEditForm((f) => ({ ...f, password: val }))}
              style={styles.formInput}
              secureTextEntry
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={() => setEditForm((f) => ({ ...f, role: 'user' }))}
                style={{ padding: 6, backgroundColor: editForm.role === 'user' ? '#2F8F6B' : '#eee', borderRadius: 4 }}
              >
                <Text style={{ color: editForm.role === 'user' ? '#fff' : '#333' }}>User</Text>
              </Pressable>
              <Pressable
                onPress={() => setEditForm((f) => ({ ...f, role: 'admin' }))}
                style={{ padding: 6, backgroundColor: editForm.role === 'admin' ? '#0056b3' : '#eee', borderRadius: 4 }}
              >
                <Text style={{ color: editForm.role === 'admin' ? '#fff' : '#333' }}>Admin</Text>
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Pressable style={styles.primarySmall} onPress={handleSaveEdit}>
              <Text style={styles.primaryText}>บันทึกการเปลี่ยนแปลง</Text>
            </Pressable>
            <Pressable style={{ padding: 8 }} onPress={() => setEditingUser(null)}>
              <Text style={{ color: '#666' }}>ยกเลิก</Text>
            </Pressable>
          </View>
        </Card>
      )}

      {table('Admin accounts', admins, 'No Admin accounts found.', true)}
      {table('Regular users', regularUsers, 'No regular users found.', false)}

      {/* Inspect Food Logs Modal */}
      {inspectingUser && (
        <Modal visible transparent animationType="fade">
          <View style={modalStyles.overlay}>
            <View style={modalStyles.container}>
              <View style={modalStyles.header}>
                <Text style={modalStyles.title}>
                  รายการอาหารของ: {inspectingUser.displayName || inspectingUser.email}
                </Text>
                <Pressable onPress={() => setInspectingUser(null)}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold' }}>✕</Text>
                </Pressable>
              </View>

              <ScrollView style={{ maxHeight: 400 }}>
                {loadingLogs ? (
                  <ActivityIndicator color="#2F8F6B" style={{ marginVertical: 20 }} />
                ) : userLogs.length === 0 ? (
                  <Text style={{ padding: 16, color: '#888', fontStyle: 'italic' }}>ผู้ใช้นี้ยังไม่มีบันทึกรายการอาหารในฐานข้อมูล `user.foods`</Text>
                ) : (
                  userLogs.map((log) => {
                    const foodTitle = log.foodName || log.name || 'อาหารที่ไม่ระบุชื่อ';
                    const kcal = log.kcal || log.calories || 0;
                    const protein = log.protein || 0;
                    const carbs = log.carbs || 0;
                    const fat = log.fat || 0;

                    return (
                      <View key={log._id} style={modalStyles.logRow}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ fontWeight: 'bold', color: '#2F8F6B', fontSize: 14 }}>{foodTitle}</Text>
                          <Text style={{ fontSize: 12, color: '#888' }}>{log.dateKey || formatDate(log.createdAt)}</Text>
                        </View>
                        <Text style={{ fontSize: 13, color: '#333', marginTop: 4 }}>
                          พลังงาน: <Text style={{ fontWeight: 'bold', color: '#D97706' }}>{kcal} kcal</Text> | โปรตีน: {protein}g | คาร์บ: {carbs}g | ไขมัน: {fat}g
                        </Text>
                        {log.entry && typeof log.entry === 'object' ? (
                          <View style={{ marginTop: 4, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#2F8F6B' }}>
                            {Object.entries(log.entry).map(([mKey, item]) => {
                              if (!item || typeof item !== 'object') return null;
                              return (
                                <Text key={mKey} style={{ fontSize: 12, color: '#555' }}>
                                  • {mKey}: {item.name || item.foodName} ({item.kcal || item.calories || 0} kcal)
                                </Text>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    );
                  })
                )}
              </ScrollView>

              <Pressable style={[styles.primarySmall, { marginTop: 12, alignSelf: 'flex-end' }]} onPress={() => setInspectingUser(null)}>
                <Text style={styles.primaryText}>ปิด</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function Foods({ foods, query, setQuery, removeFood, foodForm, setFoodForm, foodFormOpen, setFoodFormOpen, createFood }) {
  const updateField = (field, value) => setFoodForm((current) => ({ ...current, [field]: value }));
  return (
    <>
      <Title name="Food database" detail={`ฐานข้อมูลอาหารจริงจากระบบ MongoDB (${foods.length} รายการที่ค้นเจอ)`} />
      <View style={styles.filterRow}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="ค้นหาชื่ออาหาร (ภาษาไทย หรือ English)..."
          style={styles.filter}
        />
        <Pressable style={styles.primarySmall} onPress={() => setFoodFormOpen((open) => !open)}>
          <Text style={styles.primaryText}>{foodFormOpen ? 'Close form' : '+ Add food'}</Text>
        </Pressable>
      </View>

      {foodFormOpen ? (
        <Card style={{ flexBasis: 'auto' }}>
          <Text style={styles.sectionTitle}>New food record</Text>
          <View style={styles.formGrid}>
            {[
              ['foodId', 'Food ID'],
              ['nameTh', 'Thai name'],
              ['nameEn', 'English name'],
              ['kcal', 'kcal /100g'],
              ['protein_g', 'Protein (g)'],
              ['carbAvailable_g', 'Carbs (g)'],
              ['fat_g', 'Fat (g)'],
            ].map(([field, label]) => (
              <TextInput
                key={field}
                value={foodForm[field]}
                onChangeText={(value) => updateField(field, value)}
                placeholder={label}
                keyboardType={field === 'foodId' || field === 'nameTh' || field === 'nameEn' ? 'default' : 'numeric'}
                style={styles.formInput}
              />
            ))}
          </View>
          <Pressable style={styles.primarySmall} onPress={createFood}>
            <Text style={styles.primaryText}>Save food</Text>
          </Pressable>
        </Card>
      ) : null}

      <Card style={{ flexBasis: 'auto' }}>
        <View style={styles.tableHead}>
          <Text style={styles.tableCell}>Food ID</Text>
          <Text style={styles.tableCell}>Name (TH / EN)</Text>
          <Text style={styles.tableCell}>kcal /100g</Text>
          <Text style={styles.tableCell}>Protein (g)</Text>
          <Text style={styles.tableCell}>Carbs (g)</Text>
          <Text style={styles.tableCell}>Fat (g)</Text>
          <Text style={styles.tableCell}>Action</Text>
        </View>

        {foods.length === 0 ? (
          <Text style={{ padding: 16, color: '#888', fontStyle: 'italic' }}>ไม่พบรายการอาหารตามเงื่อนไขที่ค้นหา</Text>
        ) : (
          foods.map((food) => (
            <View style={styles.tableRow} key={String(food._id || food.foodId)}>
              <Text style={styles.tableCell}>{food.foodId || '-'}</Text>
              <View style={[styles.tableCell, { flex: 2 }]}>
                <Text style={styles.strong}>{food.nameTh || food.nameEn || '-'}</Text>
                {food.nameEn && food.nameTh ? <Text style={{ fontSize: 11, color: '#666' }}>{food.nameEn}</Text> : null}
              </View>
              <Text style={styles.tableCell}>{food.kcal ?? '-'}</Text>
              <Text style={styles.tableCell}>{food.protein_g ?? '-'}</Text>
              <Text style={styles.tableCell}>{food.carbAvailable_g ?? food.carbs ?? '-'}</Text>
              <Text style={styles.tableCell}>{food.fat_g ?? food.fat ?? '-'}</Text>
              <Pressable onPress={() => removeFood(food.foodId)}>
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
          ))
        )}
        <Text style={styles.footnote}>ข้อมูลอาหารดึงจาก MongoDB `foods` collection ตรงตามฐานข้อมูลจริง</Text>
      </Card>
    </>
  );
}

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    width: '100%',
    maxWidth: 550,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  logRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
});