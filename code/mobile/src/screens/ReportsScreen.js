import { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { svc, fmt } from "../api";
import { C, R, shadow } from "../theme";

const MONTHS = [
  { key: "", label: "All" },
  { key: "2026-06", label: "Jun 2026" },
  { key: "2026-05", label: "May 2026" },
];

export default function ReportsScreen() {
  const insets = useSafeAreaInsets();
  const [view, setView] = useState("pl"); // expenses | revenue | pl
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);

  const load = (m = month) => { setData(null); svc.accountsReport(m).then(setData); };
  useFocusEffect(useCallback(() => { load(); }, []));

  const pickMonth = (m) => { setMonth(m); load(m); };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 32 }}>
      <Text style={s.h1}>Accounts reports</Text>
      <Text style={s.sub}>View only · records come from the ERP</Text>

      {/* Month filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, marginBottom: 14 }}>
        {MONTHS.map((m) => (
          <TouchableOpacity key={m.key} style={[s.monthChip, month === m.key && s.monthChipOn]} onPress={() => pickMonth(m.key)}>
            <Text style={[s.monthTxt, month === m.key && s.monthTxtOn]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Report type segment */}
      <View style={s.segment}>
        {[["expenses", "Expenses"], ["revenue", "Revenue"], ["pl", "Profit & Loss"]].map(([k, lbl]) => (
          <TouchableOpacity key={k} style={[s.segBtn, view === k && s.segOn]} onPress={() => setView(k)}>
            <Text style={[s.segTxt, view === k && s.segTxtOn]}>{lbl}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!data ? <ActivityIndicator color={C.primary} style={{ marginTop: 30 }} /> : (
        <>
          {view === "expenses" && (
            <ReportBlock
              title="Expenses by head"
              groups={data.expenses.groups}
              total={data.expenses.total}
              negative
              footNote={`Includes ${data.salaryCount} salary payslip${data.salaryCount === 1 ? "" : "s"} generated from the ERP.`}
            />
          )}
          {view === "revenue" && (
            <ReportBlock title="Revenue by source" groups={data.revenue.groups} total={data.revenue.total} />
          )}
          {view === "pl" && <PLBlock pl={data.pl} />}
        </>
      )}
    </ScrollView>
  );
}

function ReportBlock({ title, groups, total, negative, footNote }) {
  const sign = negative ? "− " : "+ ";
  const color = negative ? C.danger : C.primaryDark;
  return (
    <View style={[s.card, shadow]}>
      <Text style={s.cardH}>{title}</Text>
      {groups.length === 0 ? (
        <Text style={s.empty}>Nothing recorded in this period.</Text>
      ) : (
        <>
          {groups.map((g) => {
            const share = total ? Math.round((g.amount / total) * 100) : 0;
            return (
              <View key={g.head} style={s.gRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.gHead}>{g.head}</Text>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${share}%`, backgroundColor: color }]} />
                  </View>
                </View>
                <View style={s.gRight}>
                  <Text style={[s.gAmt, { color }]}>{sign}₨ {fmt(g.amount)}</Text>
                  <Text style={s.gShare}>{share}%</Text>
                </View>
              </View>
            );
          })}
          <View style={s.totalRow}>
            <Text style={s.totalLbl}>Total</Text>
            <Text style={[s.totalVal, { color }]}>{sign}₨ {fmt(total)}</Text>
          </View>
        </>
      )}
      {footNote ? <Text style={s.foot}>{footNote}</Text> : null}
    </View>
  );
}

function PLBlock({ pl }) {
  const profit = pl.net >= 0;
  return (
    <>
      <View style={[s.netCard, shadow, { backgroundColor: profit ? C.navy : "#3A1014" }]}>
        <Text style={s.netLbl}>{profit ? "NET PROFIT" : "NET LOSS"}</Text>
        <Text style={[s.netVal, { color: profit ? C.primary : "#FF8A8A" }]}>₨ {fmt(Math.abs(pl.net))}</Text>
      </View>
      <View style={[s.card, shadow]}>
        <View style={s.plRow}>
          <Text style={s.plLbl}>Total revenue</Text>
          <Text style={[s.plVal, { color: C.primaryDark }]}>+ ₨ {fmt(pl.revenue)}</Text>
        </View>
        <View style={s.plRow}>
          <Text style={s.plLbl}>Total expenses{"\n"}<Text style={s.plSub}>salaries + other</Text></Text>
          <Text style={[s.plVal, { color: C.danger }]}>− ₨ {fmt(pl.expenses)}</Text>
        </View>
        <View style={[s.plRow, s.plTotal]}>
          <Text style={s.plTotalLbl}>{profit ? "Profit" : "Loss"}</Text>
          <Text style={[s.plTotalVal, { color: profit ? C.primaryDark : C.danger }]}>₨ {fmt(Math.abs(pl.net))}</Text>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5 },
  sub: { fontSize: 13.5, color: C.muted, marginTop: 3, marginBottom: 14 },
  monthChip: { borderRadius: R.pill, borderWidth: 1.5, borderColor: C.line, paddingVertical: 7, paddingHorizontal: 15, backgroundColor: C.card },
  monthChipOn: { backgroundColor: C.navy, borderColor: C.navy },
  monthTxt: { fontSize: 13, fontWeight: "700", color: C.muted },
  monthTxtOn: { color: C.primary },
  segment: { flexDirection: "row", backgroundColor: "#E4E9F2", borderRadius: R.pill, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: R.pill, alignItems: "center" },
  segOn: { backgroundColor: C.card },
  segTxt: { fontSize: 12.5, fontWeight: "700", color: C.muted },
  segTxtOn: { color: C.ink },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 18 },
  cardH: { fontSize: 16, fontWeight: "800", color: C.ink, marginBottom: 14 },
  gRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14, gap: 12 },
  gHead: { fontSize: 14, fontWeight: "700", color: C.ink, marginBottom: 6 },
  barTrack: { height: 6, borderRadius: 3, backgroundColor: "#EEF2F8", overflow: "hidden" },
  barFill: { height: 6, borderRadius: 3 },
  gRight: { alignItems: "flex-end" },
  gAmt: { fontSize: 14, fontWeight: "800", fontVariant: ["tabular-nums"] },
  gShare: { fontSize: 12, color: C.muted, marginTop: 2 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1.5, borderTopColor: C.line, paddingTop: 12, marginTop: 2 },
  totalLbl: { fontSize: 15, fontWeight: "800", color: C.ink },
  totalVal: { fontSize: 15.5, fontWeight: "800", fontVariant: ["tabular-nums"] },
  foot: { fontSize: 12, color: C.muted, marginTop: 12, lineHeight: 17 },
  empty: { fontSize: 13.5, color: C.muted, paddingVertical: 10 },
  netCard: { borderRadius: R.card, padding: 22, alignItems: "center", marginBottom: 14 },
  netLbl: { color: "rgba(255,255,255,0.55)", fontSize: 11.5, fontWeight: "700", letterSpacing: 1.3 },
  netVal: { fontSize: 34, fontWeight: "800", marginTop: 6, letterSpacing: -0.5 },
  plRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line },
  plLbl: { fontSize: 14.5, color: C.ink, fontWeight: "600" },
  plSub: { fontSize: 12, color: C.muted, fontWeight: "400" },
  plVal: { fontSize: 15, fontWeight: "800", fontVariant: ["tabular-nums"] },
  plTotal: { borderBottomWidth: 0, paddingTop: 14 },
  plTotalLbl: { fontSize: 16, fontWeight: "800", color: C.ink },
  plTotalVal: { fontSize: 17, fontWeight: "800", fontVariant: ["tabular-nums"] },
});
