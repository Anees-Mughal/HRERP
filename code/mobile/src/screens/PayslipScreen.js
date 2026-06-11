import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { svc, tokenStore, fmt, THIS_MONTH } from "../api";
import { C, R, shadow } from "../theme";

export default function PayslipScreen() {
  const insets = useSafeAreaInsets();
  const [role, setRole] = useState(null);
  useFocusEffect(useCallback(() => {
    tokenStore.getUser().then((u) => setRole(u?.role || "Staff"));
  }, []));
  if (!role) return null;
  return role === "Head" ? <HeadView insets={insets} /> : <StaffView insets={insets} />;
}

/* Head: read-only payroll overview — who's generated, who's not. Edits happen in the web ERP. */
function HeadView({ insets }) {
  const [rows, setRows] = useState(null);
  const [openSlips, setOpenSlips] = useState(null); // {employee, slips}

  useFocusEffect(useCallback(() => { svc.payslipsOverview(THIS_MONTH).then(setRows); }, []));

  const showSlips = async (employee) => {
    const slips = await svc.payslipsOf(employee.id);
    setOpenSlips({ employee, slips });
  };

  if (openSlips) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
        <TouchableOpacity onPress={() => setOpenSlips(null)}><Text style={s.back}>← Back to payroll</Text></TouchableOpacity>
        <Text style={s.h1}>{openSlips.employee.fullName}</Text>
        <Text style={s.sub}>Generated payslips</Text>
        {openSlips.slips.length === 0 ? (
          <Text style={[s.meta, { marginTop: 14 }]}>No payslips generated yet for this employee.</Text>
        ) : openSlips.slips.map((p) => <SlipCard key={p.id} p={p} />)}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>Payroll — {THIS_MONTH}</Text>
      <Text style={s.sub}>View only · edit values & run payroll from the web ERP</Text>
      {!rows ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> :
        rows.map(({ employee, slip, generated }) => (
          <TouchableOpacity key={employee.id} style={[s.card, shadow]} onPress={() => showSlips(employee)} activeOpacity={0.85}>
            <View style={{ flex: 1 }}>
              <Text style={s.name}>{employee.fullName}</Text>
              <Text style={s.meta}>{employee.designation}{slip ? ` · net ₨ ${fmt(slip.net)}` : ""}</Text>
            </View>
            <View style={[s.pill, { backgroundColor: generated ? C.okSoft : C.warnSoft }]}>
              <Text style={[s.pillTxt, { color: generated ? C.ok : C.warn }]}>
                {generated ? "Generated" : "Not generated"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
    </ScrollView>
  );
}

/* Staff: current + previous payslips, tap to expand detail */
function StaffView({ insets }) {
  const [slips, setSlips] = useState(null);
  const [selected, setSelected] = useState(null);

  useFocusEffect(useCallback(() => {
    svc.myPayslips().then((ps) => { setSlips(ps); setSelected(ps[0] || null); });
  }, []));

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>My payslips</Text>
      <Text style={s.sub}>Current and previous months</Text>

      {!slips ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            {slips.map((p) => (
              <TouchableOpacity key={p.id}
                style={[s.monthChip, selected?.id === p.id && s.monthChipOn]}
                onPress={() => setSelected(p)}>
                <Text style={[s.monthTxt, selected?.id === p.id && s.monthTxtOn]}>{p.month}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {selected && <SlipCard p={selected} full />}
        </>
      )}
    </ScrollView>
  );
}

function SlipCard({ p, full }) {
  return (
    <>
      <View style={[s.netCard, shadow, { marginTop: 16 }]}>
        <Text style={s.netLbl}>NET PAY · {p.month.toUpperCase()}</Text>
        <Text style={s.netVal}>₨ {fmt(p.net)}</Text>
      </View>
      <View style={[s.detail, shadow]}>
        <Text style={s.detailH}>Earnings</Text>
        <Row l="Basic salary" v={p.basic} />
        <Row l="House rent allowance" v={p.hra} />
        <Row l="Medical allowance" v={p.medical} />
        <Row l="Conveyance" v={p.conveyance} />
        <Row l="Gross" v={p.gross} bold />
        <Text style={[s.detailH, { marginTop: 14 }]}>Deductions</Text>
        <Row l="Income tax (FBR)" v={-p.tax} neg />
        <Row l="EOBI" v={-p.eobi} neg />
        {p.loan > 0 && <Row l="Loan instalment" v={-p.loan} neg />}
        <Row l="Total deductions" v={-p.totalDeductions} neg bold />
        {full && <Text style={s.note}>Generated on {p.generatedOn} from the ERP.</Text>}
      </View>
    </>
  );
}

function Row({ l, v, bold, neg }) {
  return (
    <View style={s.row}>
      <Text style={[s.rowL, bold && s.bold]}>{l}</Text>
      <Text style={[s.rowV, bold && s.bold, neg && { color: C.danger }]}>
        {v < 0 ? `− ₨ ${fmt(Math.abs(v))}` : `₨ ${fmt(v)}`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  sub: { fontSize: 13.5, color: C.muted, marginTop: 3, marginBottom: 14 },
  back: { fontSize: 14, fontWeight: "800", color: C.primaryDark, marginBottom: 10 },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  pill: { borderRadius: R.pill, paddingVertical: 5, paddingHorizontal: 11 },
  pillTxt: { fontSize: 12, fontWeight: "800" },
  monthChip: { borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, paddingVertical: 8, paddingHorizontal: 16, backgroundColor: C.card },
  monthChipOn: { backgroundColor: C.navy, borderColor: C.navy },
  monthTxt: { fontSize: 13.5, fontWeight: "700", color: C.muted },
  monthTxtOn: { color: C.primary },
  netCard: { backgroundColor: C.navy, borderRadius: R.card, padding: 20, alignItems: "center" },
  netLbl: { color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: "700", letterSpacing: 1.3 },
  netVal: { color: C.primary, fontSize: 32, fontWeight: "800", marginTop: 6 },
  detail: { backgroundColor: C.card, borderRadius: R.card, padding: 20, marginTop: 14 },
  detailH: { fontSize: 15, fontWeight: "800", color: C.ink, marginBottom: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.line },
  rowL: { fontSize: 14, color: C.ink, flex: 1, paddingRight: 10 },
  rowV: { fontSize: 14.5, fontWeight: "700", color: C.ink, fontVariant: ["tabular-nums"] },
  bold: { fontWeight: "800", fontSize: 15 },
  note: { fontSize: 12, color: C.muted, marginTop: 12, textAlign: "center" },
});
