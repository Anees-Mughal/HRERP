import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { svc, fmt } from "../api";
import { C, R, shadow } from "../theme";

const STATUS_COLOR = { Approved: C.ok, Active: C.ok, Pending: C.warn, Rejected: C.danger };

export default function ApprovalsScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState("leaves");
  const [leaves, setLeaves] = useState(null);
  const [loans, setLoans] = useState(null);

  const load = async () => {
    const [ls, lns] = await Promise.all([svc.leavesAll(), svc.loansAll()]);
    setLeaves(ls); setLoans(lns);
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const decideLeave = async (l, status) => { await svc.decideLeave(l.id, status); await load(); };
  const decideLoan = async (l, status) => { await svc.decideLoan(l.id, status); await load(); };

  const list = view === "leaves" ? leaves : loans;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>Approvals</Text>

      <View style={s.segment}>
        {["leaves", "loans"].map((v) => (
          <TouchableOpacity key={v} style={[s.segBtn, view === v && s.segOn]} onPress={() => setView(v)}>
            <Text style={[s.segTxt, view === v && s.segTxtOn]}>{v === "leaves" ? "Leave requests" : "Loans & advances"}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!list ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> :
        list.map((item) => (
          <View key={item.id} style={[s.card, shadow]}>
            <View style={s.top}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{item.employee?.fullName}</Text>
                {view === "leaves" ? (
                  <>
                    <Text style={s.meta}>{item.type} · {item.days} day{item.days > 1 ? "s" : ""} · {item.from} → {item.to}</Text>
                    <Text style={s.reason}>{item.reason}</Text>
                  </>
                ) : (
                  <>
                    <Text style={s.meta}>₨ {fmt(item.amount)} · ₨ {fmt(item.instalment)}/month</Text>
                    <Text style={s.reason}>{item.reason}</Text>
                  </>
                )}
              </View>
              <View style={[s.pill, { backgroundColor: (STATUS_COLOR[item.status] || C.muted) + "22" }]}>
                <Text style={[s.pillTxt, { color: STATUS_COLOR[item.status] || C.muted }]}>{item.status}</Text>
              </View>
            </View>
            {item.status === "Pending" && (
              <View style={s.btnRow}>
                <TouchableOpacity style={[s.btn, s.approve]}
                  onPress={() => view === "leaves" ? decideLeave(item, "Approved") : decideLoan(item, "Active")}>
                  <Text style={s.approveTxt}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btn, s.reject]}
                  onPress={() => view === "leaves" ? decideLeave(item, "Rejected") : decideLoan(item, "Rejected")}>
                  <Text style={s.rejectTxt}>Reject</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5, marginBottom: 14 },
  segment: { flexDirection: "row", backgroundColor: "#E4E9F2", borderRadius: R.pill, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: R.pill, alignItems: "center" },
  segOn: { backgroundColor: C.card },
  segTxt: { fontSize: 13, fontWeight: "700", color: C.muted },
  segTxtOn: { color: C.ink },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 12 },
  top: { flexDirection: "row", gap: 10 },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 3 },
  reason: { fontSize: 13, color: C.ink, marginTop: 4 },
  pill: { borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11, alignSelf: "flex-start" },
  pillTxt: { fontSize: 12, fontWeight: "800" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  btn: { flex: 1, height: 42, borderRadius: R.btn, alignItems: "center", justifyContent: "center" },
  approve: { backgroundColor: C.okSoft },
  approveTxt: { color: C.ok, fontWeight: "800", fontSize: 14 },
  reject: { backgroundColor: C.dangerSoft },
  rejectTxt: { color: C.danger, fontWeight: "800", fontSize: 14 },
});
