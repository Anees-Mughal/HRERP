import { useCallback, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { svc, fmt } from "../api";
import { C, R, shadow } from "../theme";

const STATUS_COLOR = { Approved: C.ok, Active: C.ok, Completed: C.ok, Pending: C.warn, Rejected: C.danger };
const TYPES = ["Annual", "Sick", "Casual", "Hajj", "Maternity"];

export default function RequestsScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState("leave"); // leave | loan
  const [leaves, setLeaves] = useState(null);
  const [loans, setLoans] = useState(null);
  const [balances, setBalances] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({});
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [ls, lns, bs] = await Promise.all([svc.myLeaves(), svc.myLoans(), svc.balances()]);
    setLeaves(ls); setLoans(lns); setBalances(bs);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const openSheet = () => {
    setForm(view === "leave" ? { type: "Casual", from: "", to: "", reason: "" } : { amount: "", instalment: "", reason: "" });
    setErr(""); setOpen(true);
  };

  const submit = async () => {
    setErr("");
    if (view === "leave") {
      const re = /^\d{4}-\d{2}-\d{2}$/;
      if (!re.test(form.from) || !re.test(form.to)) return setErr("Dates must be YYYY-MM-DD.");
      if (new Date(form.to) < new Date(form.from)) return setErr("End date can't be before start.");
      if (!form.reason?.trim()) return setErr("Add a short reason.");
      const days = Math.round((new Date(form.to) - new Date(form.from)) / 86400000) + 1;
      setBusy(true);
      try { await svc.applyLeave({ ...form, days }); setOpen(false); await load(); }
      finally { setBusy(false); }
    } else {
      const amount = Number(form.amount), instalment = Number(form.instalment);
      if (!amount || amount <= 0) return setErr("Enter a valid amount.");
      if (!instalment || instalment <= 0 || instalment > amount) return setErr("Instalment must be between 1 and the amount.");
      setBusy(true);
      try { await svc.applyLoan({ amount, instalment, reason: form.reason || "Advance" }); setOpen(false); await load(); }
      finally { setBusy(false); }
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 110 }}>
        <Text style={s.h1}>Requests</Text>

        <View style={s.segment}>
          {["leave", "loan"].map((v) => (
            <TouchableOpacity key={v} style={[s.segBtn, view === v && s.segOn]} onPress={() => setView(v)}>
              <Text style={[s.segTxt, view === v && s.segTxtOn]}>{v === "leave" ? "Leave" : "Loan / advance"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {view === "leave" && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {balances.map((b) => (
              <View key={b.type} style={[s.balCard, shadow]}>
                <Text style={s.balVal}>{b.quota - b.used}<Text style={s.balQ}> / {b.quota}</Text></Text>
                <Text style={s.balLbl}>{b.type}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={s.section}>My {view === "leave" ? "leave requests" : "loans & advances"}</Text>
        {view === "leave" ? (
          !leaves ? <ActivityIndicator color={C.primary} /> :
          leaves.map((l) => (
            <View key={l.id} style={[s.card, shadow]}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardT}>{l.type} · {l.days} day{l.days > 1 ? "s" : ""}</Text>
                <Text style={s.meta}>{l.from} → {l.to}</Text>
                <Text style={s.reason}>{l.reason}</Text>
              </View>
              <Pill status={l.status} />
            </View>
          ))
        ) : (
          !loans ? <ActivityIndicator color={C.primary} /> :
          loans.map((l) => (
            <View key={l.id} style={[s.card, shadow]}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardT}>₨ {fmt(l.amount)}</Text>
                <Text style={s.meta}>₨ {fmt(l.instalment)}/month · remaining ₨ {fmt(l.remaining)}</Text>
                <Text style={s.reason}>{l.reason}</Text>
              </View>
              <Pill status={l.status} />
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[s.fab, shadow]} onPress={openSheet} activeOpacity={0.9}>
        <Text style={s.fabTxt}>+ Apply for {view === "leave" ? "leave" : "loan / advance"}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={s.scrim}>
          <View style={s.sheet}>
            <Text style={s.sheetH}>{view === "leave" ? "Apply for leave" : "Request loan / advance"}</Text>
            {!!err && <View style={s.errBox}><Text style={s.errTxt}>{err}</Text></View>}

            {view === "leave" ? (
              <>
                <Text style={s.lbl}>Leave type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {TYPES.map((t) => (
                    <TouchableOpacity key={t} style={[s.chip, form.type === t && s.chipOn]}
                      onPress={() => setForm({ ...form, type: t })}>
                      <Text style={[s.chipTxt, form.type === t && s.chipTxtOn]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text style={s.lbl}>From (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={form.from} placeholder="2026-06-20"
                  placeholderTextColor={C.muted} onChangeText={(v) => setForm({ ...form, from: v })} />
                <Text style={s.lbl}>To (YYYY-MM-DD)</Text>
                <TextInput style={s.input} value={form.to} placeholder="2026-06-22"
                  placeholderTextColor={C.muted} onChangeText={(v) => setForm({ ...form, to: v })} />
              </>
            ) : (
              <>
                <Text style={s.lbl}>Amount (PKR)</Text>
                <TextInput style={s.input} value={form.amount} keyboardType="numeric" placeholder="50000"
                  placeholderTextColor={C.muted} onChangeText={(v) => setForm({ ...form, amount: v })} />
                <Text style={s.lbl}>Monthly instalment (PKR)</Text>
                <TextInput style={s.input} value={form.instalment} keyboardType="numeric" placeholder="10000"
                  placeholderTextColor={C.muted} onChangeText={(v) => setForm({ ...form, instalment: v })} />
              </>
            )}

            <Text style={s.lbl}>Reason</Text>
            <TextInput style={[s.input, { height: 70, textAlignVertical: "top", paddingTop: 12 }]}
              value={form.reason} multiline placeholder="Short reason…"
              placeholderTextColor={C.muted} onChangeText={(v) => setForm({ ...form, reason: v })} />

            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setOpen(false)}>
                <Text style={s.btnGhostTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={submit} disabled={busy}>
                {busy ? <ActivityIndicator color="#04201C" /> : <Text style={s.btnTxt}>Submit request</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Pill({ status }) {
  const c = STATUS_COLOR[status] || C.muted;
  return (
    <View style={{ borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11, backgroundColor: c + "22", alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 12, fontWeight: "800", color: c }}>{status}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5, marginBottom: 14 },
  segment: { flexDirection: "row", backgroundColor: "#E4E9F2", borderRadius: R.pill, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: R.pill, alignItems: "center" },
  segOn: { backgroundColor: C.card },
  segTxt: { fontSize: 13.5, fontWeight: "700", color: C.muted },
  segTxtOn: { color: C.ink },
  balCard: { backgroundColor: C.card, borderRadius: R.card, padding: 16, minWidth: 105 },
  balVal: { fontSize: 22, fontWeight: "800", color: C.primaryDark },
  balQ: { fontSize: 13, color: C.muted, fontWeight: "600" },
  balLbl: { fontSize: 12.5, color: C.muted, marginTop: 3 },
  section: { fontSize: 16, fontWeight: "800", color: C.ink, marginTop: 20, marginBottom: 12 },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  cardT: { fontSize: 15, fontWeight: "800", color: C.ink },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  reason: { fontSize: 13, color: C.ink, marginTop: 4 },
  fab: { position: "absolute", bottom: 20, left: 18, right: 18, height: 52, backgroundColor: C.primary, borderRadius: R.pill, alignItems: "center", justifyContent: "center" },
  fabTxt: { fontWeight: "800", fontSize: 15.5, color: "#04201C" },
  scrim: { flex: 1, backgroundColor: "rgba(15,20,32,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 38 },
  sheetH: { fontSize: 19, fontWeight: "800", color: C.ink, marginBottom: 8 },
  lbl: { fontSize: 12.5, fontWeight: "700", color: C.ink, marginTop: 14, marginBottom: 6 },
  input: { height: 48, borderWidth: 1.5, borderColor: C.line, borderRadius: R.btn, paddingHorizontal: 13, fontSize: 15, color: C.ink },
  chip: { borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, paddingVertical: 8, paddingHorizontal: 15 },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt: { fontSize: 13.5, fontWeight: "700", color: C.muted },
  chipTxtOn: { color: "#04201C" },
  btn: { height: 50, borderRadius: R.btn, backgroundColor: C.primary, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  btnTxt: { fontWeight: "800", fontSize: 15, color: "#04201C" },
  btnGhost: { backgroundColor: "transparent", borderWidth: 1.5, borderColor: C.line },
  btnGhostTxt: { fontWeight: "700", fontSize: 15, color: C.ink },
  errBox: { backgroundColor: C.dangerSoft, borderRadius: 10, padding: 11, marginTop: 6 },
  errTxt: { color: C.danger, fontSize: 13 },
});
