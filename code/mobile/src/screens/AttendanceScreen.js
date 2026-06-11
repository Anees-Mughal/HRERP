import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { svc, tokenStore } from "../api";
import { C, R, shadow } from "../theme";

const today = new Date().toISOString().slice(0, 10);
const STATUS_COLOR = { Present: C.ok, Late: C.warn, Absent: C.danger };

export default function AttendanceScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState(null);

  useFocusEffect(useCallback(() => {
    tokenStore.getUser().then((u) => setRole(u?.role || "Staff"));
  }, []));

  if (!role) return null;
  return role === "Head" ? <HeadView insets={insets} /> : <StaffView insets={insets} />;
}

/* ---- Head: mark attendance for all staff ---- */
function HeadView({ insets }) {
  const [rows, setRows] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const load = () => svc.attendanceFor(today).then(setRows);
  useFocusEffect(useCallback(() => { load(); }, []));

  const mark = async (employeeId, status) => {
    setBusyId(employeeId);
    try {
      const now = new Date().toTimeString().slice(0, 5);
      await svc.markAttendance(employeeId, today, {
        status,
        inTime: status === "Absent" ? "" : now,
      });
      await load();
    } finally { setBusyId(null); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>Mark attendance</Text>
      <Text style={s.sub}>{new Date().toDateString()}</Text>
      {!rows ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> :
        rows.map(({ employee, record }) => (
          <View key={employee.id} style={[s.card, shadow]}>
            <View style={s.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{employee.fullName}</Text>
                <Text style={s.meta}>
                  {employee.designation}
                  {record?.inTime ? ` · in ${record.inTime}` : ""}{record?.outTime ? ` · out ${record.outTime}` : ""}
                </Text>
              </View>
              {record && (
                <View style={[s.pill, { backgroundColor: (STATUS_COLOR[record.status] || C.muted) + "22" }]}>
                  <Text style={[s.pillTxt, { color: STATUS_COLOR[record.status] || C.muted }]}>{record.status}</Text>
                </View>
              )}
            </View>
            <View style={s.btnRow}>
              {["Present", "Late", "Absent"].map((st) => (
                <TouchableOpacity key={st}
                  style={[s.markBtn, record?.status === st && { borderColor: STATUS_COLOR[st], backgroundColor: STATUS_COLOR[st] + "15" }]}
                  disabled={busyId === employee.id}
                  onPress={() => mark(employee.id, st)}>
                  <Text style={[s.markTxt, record?.status === st && { color: STATUS_COLOR[st] }]}>{st}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

/* ---- Staff: check-in + history by date range ---- */
function StaffView({ insets }) {
  const [recs, setRecs] = useState(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const load = (f = from, t = to) => svc.myAttendance(f, t).then(setRecs);
  useFocusEffect(useCallback(() => { load("", ""); }, []));

  const todayRec = recs?.find((a) => a.date === today);

  const checkIn = async () => {
    setBusy(true);
    try { await svc.checkIn(); await load(); } finally { setBusy(false); }
  };

  const filter = () => {
    const re = /^\d{4}-\d{2}-\d{2}$/;
    load(re.test(from) ? from : "", re.test(to) ? to : "");
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>My attendance</Text>

      <View style={[s.card, shadow, { alignItems: "center", paddingVertical: 24 }]}>
        {todayRec ? (
          <>
            <Text style={{ fontSize: 30, color: STATUS_COLOR[todayRec.status] }}>✓</Text>
            <Text style={s.bigStatus}>{todayRec.status}</Text>
            <Text style={s.meta}>Checked in at {todayRec.inTime}</Text>
          </>
        ) : (
          <>
            <Text style={s.bigStatus}>Not marked today</Text>
            <TouchableOpacity style={s.checkBtn} onPress={checkIn} disabled={busy} activeOpacity={0.85}>
              {busy ? <ActivityIndicator color="#04201C" /> : <Text style={s.checkTxt}>Check in now</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <Text style={s.section}>History — filter by date</Text>
      <View style={s.filterRow}>
        <TextInput style={s.dateInput} value={from} onChangeText={setFrom}
          placeholder="From YYYY-MM-DD" placeholderTextColor={C.muted} />
        <TextInput style={s.dateInput} value={to} onChangeText={setTo}
          placeholder="To YYYY-MM-DD" placeholderTextColor={C.muted} />
        <TouchableOpacity style={s.goBtn} onPress={filter}><Text style={s.goTxt}>Go</Text></TouchableOpacity>
      </View>

      {!recs ? <ActivityIndicator color={C.primary} style={{ marginTop: 20 }} /> :
        recs.length === 0 ? <Text style={[s.meta, { textAlign: "center", marginTop: 18 }]}>No records in this range.</Text> :
        recs.map((a) => (
          <View key={a.id} style={[s.histRow, shadow]}>
            <View style={{ flex: 1 }}>
              <Text style={s.histDate}>{a.date}</Text>
              <Text style={s.meta}>{a.inTime ? `In ${a.inTime}` : "—"}{a.outTime ? ` · Out ${a.outTime}` : ""}</Text>
            </View>
            <View style={[s.pill, { backgroundColor: (STATUS_COLOR[a.status] || C.muted) + "22" }]}>
              <Text style={[s.pillTxt, { color: STATUS_COLOR[a.status] || C.muted }]}>{a.status}</Text>
            </View>
          </View>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 16 },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 12, marginTop: 4 },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  markBtn: { flex: 1, borderWidth: 1.5, borderColor: C.line, borderRadius: R.btn, paddingVertical: 9, alignItems: "center" },
  markTxt: { fontSize: 13, fontWeight: "800", color: C.muted },
  pill: { borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11 },
  pillTxt: { fontSize: 12, fontWeight: "800" },
  bigStatus: { fontSize: 20, fontWeight: "800", color: C.ink, marginTop: 6 },
  checkBtn: { marginTop: 14, height: 48, borderRadius: R.btn, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 30 },
  checkTxt: { fontWeight: "800", fontSize: 15, color: "#04201C" },
  section: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 18, marginBottom: 10 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  dateInput: { flex: 1, height: 44, borderWidth: 1.5, borderColor: C.line, borderRadius: R.btn, paddingHorizontal: 10, fontSize: 13, color: C.ink, backgroundColor: C.card },
  goBtn: { height: 44, borderRadius: R.btn, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 16 },
  goTxt: { fontWeight: "800", fontSize: 14, color: "#04201C" },
  histRow: { backgroundColor: C.card, borderRadius: R.card, padding: 14, marginBottom: 10, flexDirection: "row", alignItems: "center" },
  histDate: { fontSize: 14.5, fontWeight: "800", color: C.ink },
});
