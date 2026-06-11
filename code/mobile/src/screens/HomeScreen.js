import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { svc, tokenStore, fmt, THIS_MONTH } from "../api";
import { C, R, shadow } from "../theme";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [head, setHead] = useState(null);   // head dashboard data
  const [staff, setStaff] = useState(null); // staff dashboard data
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const u = await tokenStore.getUser();
    setUser(u);
    if (u?.role === "Head") {
      const [emps, leaves, overview] = await Promise.all([
        svc.employees(), svc.leavesAll(), svc.payslipsOverview(THIS_MONTH),
      ]);
      setHead({
        total: emps.filter((e) => e.isActive).length,
        pending: leaves.filter((l) => l.status === "Pending").length,
        generated: overview.filter((o) => o.generated).length,
        ofTotal: overview.length,
      });
    } else {
      const [slips, att] = await Promise.all([svc.myPayslips(), svc.myAttendance()]);
      setStaff({ latest: slips[0] || null, todayRec: att.find((a) => a.date === new Date().toISOString().slice(0, 10)) });
    }
  };
  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };
  const logout = async () => { await tokenStore.clear(); navigation.getParent()?.reset({ index: 0, routes: [{ name: "Login" }] }); };
  const isHead = user?.role === "Head";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}
    >
      <View style={s.topRow}>
        <View>
          <Text style={s.greet}>Salam, {user?.fullName?.split(" ")[0] || "—"} 👋</Text>
          <Text style={s.sub}>{isHead ? "Owner · full access" : "Staff member"}</Text>
        </View>
        {isHead && (
          <TouchableOpacity onPress={logout} style={s.signout}>
            <Text style={s.signoutTxt}>Sign out</Text>
          </TouchableOpacity>
        )}
      </View>

      {isHead ? (
        <>
          <View style={[s.payCard, shadow]}>
            <Text style={s.payLbl}>PAYSLIPS GENERATED · {THIS_MONTH.toUpperCase()}</Text>
            <Text style={s.payVal}>{head ? `${head.generated} / ${head.ofTotal}` : "—"}</Text>
            <TouchableOpacity style={s.payBtn} onPress={() => navigation.navigate(isHead ? "Payroll" : "Payslip")} activeOpacity={0.85}>
              <Text style={s.payBtnTxt}>View payroll →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.row}>
            <Tile ico="◉" val={head?.total ?? "—"} lbl="Active staff" onPress={() => navigation.navigate("Staff")} />
            <Tile ico="✔" val={head?.pending ?? "—"} lbl="Pending approvals" onPress={() => navigation.navigate("Approvals")} />
          </View>
          <View style={s.row}>
            <Tile ico="✓" val="Mark" lbl="Today's attendance" onPress={() => navigation.navigate("Attendance")} />
            <Tile ico="+" val="Add" lbl="New employee" onPress={() => navigation.navigate("Staff", { add: Date.now() })} />
          </View>
          <View style={s.row}>
            <Tile ico="Σ" val="Reports" lbl="Expenses · Revenue · P&L" onPress={() => navigation.navigate("Reports")} />
            <Tile ico="₨" val="Payroll" lbl="Generated payslips" onPress={() => navigation.navigate("Payroll")} />
          </View>
          <Text style={s.note}>Payroll values are edited from the web ERP — mobile shows the generated payslips.</Text>
        </>
      ) : (
        <>
          <View style={[s.payCard, shadow]}>
            <Text style={s.payLbl}>NET PAY · {staff?.latest?.month?.toUpperCase() || "…"}</Text>
            <Text style={s.payVal}>₨ {staff?.latest ? fmt(staff.latest.net) : "—"}</Text>
            <TouchableOpacity style={s.payBtn} onPress={() => navigation.navigate(isHead ? "Payroll" : "Payslip")} activeOpacity={0.85}>
              <Text style={s.payBtnTxt}>Current & previous payslips →</Text>
            </TouchableOpacity>
          </View>
          <View style={s.row}>
            <Tile ico="✓" val={staff?.todayRec?.status || "Not marked"} lbl="Today's attendance" onPress={() => navigation.navigate("Attendance")} />
            <Tile ico="✈" val="Apply" lbl="Leave / loan request" onPress={() => navigation.navigate("Requests")} />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Tile({ ico, val, lbl, onPress }) {
  return (
    <TouchableOpacity style={[s.tile, shadow]} onPress={onPress} activeOpacity={0.85}>
      <Text style={s.tileIco}>{ico}</Text>
      <Text style={s.tileVal} numberOfLines={1}>{val}</Text>
      <Text style={s.tileLbl}>{lbl}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greet: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  sub: { fontSize: 14, color: C.muted, marginTop: 3, marginBottom: 18 },
  signout: { borderWidth: 1.5, borderColor: C.line, borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 13 },
  signoutTxt: { fontSize: 12.5, fontWeight: "700", color: C.muted },
  payCard: { backgroundColor: C.navy, borderRadius: R.card, padding: 22 },
  payLbl: { color: "rgba(255,255,255,0.55)", fontSize: 11.5, fontWeight: "700", letterSpacing: 1.2 },
  payVal: { color: C.primary, fontSize: 34, fontWeight: "800", marginTop: 8, letterSpacing: -0.5 },
  payBtn: { marginTop: 16, alignSelf: "flex-start", backgroundColor: "rgba(255,255,255,0.1)", borderRadius: R.pill, paddingVertical: 9, paddingHorizontal: 16 },
  payBtnTxt: { color: "#fff", fontWeight: "700", fontSize: 13.5 },
  row: { flexDirection: "row", gap: 14, marginTop: 16 },
  tile: { flex: 1, backgroundColor: C.card, borderRadius: R.card, padding: 18 },
  tileIco: { fontSize: 20, color: C.primary },
  tileVal: { fontSize: 17, fontWeight: "800", color: C.ink, marginTop: 10 },
  tileLbl: { fontSize: 12.5, color: C.muted, marginTop: 3 },
  note: { fontSize: 12.5, color: C.muted, marginTop: 18, textAlign: "center", lineHeight: 18 },
});
