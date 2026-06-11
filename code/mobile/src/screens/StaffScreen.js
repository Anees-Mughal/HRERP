import { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Modal, StyleSheet, ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRoute } from "@react-navigation/native";
import { svc } from "../api";
import { C, R, shadow } from "../theme";

const EMPTY = { fullName: "", cnic: "", designation: "", departmentId: null, basicSalary: "", email: "", phone: "", employmentType: "Permanent" };

export default function StaffScreen() {
  const insets = useSafeAreaInsets();
  const params = useRoute().params || {};
  const [view, setView] = useState("employees"); // employees | departments
  const [employees, setEmployees] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [editing, setEditing] = useState(null); // 'new' | employee object
  const [editingDept, setEditingDept] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [deptName, setDeptName] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [emps, depts] = await Promise.all([svc.employees(), svc.departments()]);
    setEmployees(emps); setDepartments(depts);
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  useEffect(() => { if (params.add) { setForm(EMPTY); setEditing("new"); } }, [params.add]);

  const openEdit = (e) => { setForm({ ...e, basicSalary: String(e.basicSalary) }); setEditing(e); setErr(""); };

  const save = async () => {
    setErr("");
    if (!form.fullName.trim()) return setErr("Name is required.");
    if (form.cnic && !/^\d{5}-\d{7}-\d$/.test(form.cnic)) return setErr("CNIC: 00000-0000000-0 format.");
    if (!Number(form.basicSalary)) return setErr("Enter a valid basic salary.");
    setBusy(true);
    try {
      const payload = { ...form, basicSalary: Number(form.basicSalary), departmentId: form.departmentId || departments[0]?.id };
      if (editing === "new") await svc.addEmployee(payload);
      else await svc.updateEmployee(editing.id, payload);
      setEditing(null);
      await load();
    } finally { setBusy(false); }
  };

  const saveDept = async () => {
    if (!deptName.trim()) return;
    setBusy(true);
    try {
      if (editingDept === "new") await svc.addDepartment({ name: deptName.trim() });
      else await svc.updateDepartment(editingDept.id, { name: deptName.trim() });
      setEditingDept(null);
      await load();
    } finally { setBusy(false); }
  };

  const set = (k) => (v) => setForm({ ...form, [k]: v });

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 18, paddingTop: insets.top + 14, paddingBottom: 110 }}>
        <Text style={s.h1}>Staff</Text>

        <View style={s.segment}>
          {["employees", "departments"].map((v) => (
            <TouchableOpacity key={v} style={[s.segBtn, view === v && s.segOn]} onPress={() => setView(v)}>
              <Text style={[s.segTxt, view === v && s.segTxtOn]}>{v === "employees" ? "Employees" : "Departments"}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {view === "employees" ? (
          !employees ? <ActivityIndicator color={C.primary} style={{ marginTop: 24 }} /> :
          employees.map((e) => (
            <TouchableOpacity key={e.id} style={[s.card, shadow]} onPress={() => openEdit(e)} activeOpacity={0.85}>
              <View style={s.avatar}><Text style={s.avatarTxt}>{e.fullName.split(" ").map((w) => w[0]).slice(0, 2).join("")}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{e.fullName}</Text>
                <Text style={s.meta}>{e.designation} · {departments.find((d) => d.id === e.departmentId)?.name || "—"}</Text>
              </View>
              <Text style={s.edit}>Edit</Text>
            </TouchableOpacity>
          ))
        ) : (
          departments.map((d) => (
            <TouchableOpacity key={d.id} style={[s.card, shadow]} activeOpacity={0.85}
              onPress={() => { setEditingDept(d); setDeptName(d.name); }}>
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{d.name}</Text>
                <Text style={s.meta}>{(employees || []).filter((e) => e.departmentId === d.id && e.isActive).length} employees</Text>
              </View>
              <Text style={s.edit}>Edit</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[s.fab, shadow]} activeOpacity={0.9}
        onPress={() => view === "employees"
          ? (setForm(EMPTY), setEditing("new"), setErr(""))
          : (setDeptName(""), setEditingDept("new"))}>
        <Text style={s.fabTxt}>+ Add {view === "employees" ? "employee" : "department"}</Text>
      </TouchableOpacity>

      {/* Employee modal */}
      <Modal visible={!!editing} transparent animationType="slide" onRequestClose={() => setEditing(null)}>
        <View style={s.scrim}>
          <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={s.sheetH}>{editing === "new" ? "Add employee" : "Edit employee"}</Text>
            {!!err && <View style={s.errBox}><Text style={s.errTxt}>{err}</Text></View>}
            <Field lbl="Full name *" val={form.fullName} on={set("fullName")} />
            <Field lbl="CNIC" val={form.cnic} on={set("cnic")} ph="35202-1234567-1" />
            <Field lbl="Designation" val={form.designation} on={set("designation")} />
            <Text style={s.lbl}>Department</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {departments.map((d) => (
                <TouchableOpacity key={d.id} style={[s.chip, form.departmentId === d.id && s.chipOn]}
                  onPress={() => setForm({ ...form, departmentId: d.id })}>
                  <Text style={[s.chipTxt, form.departmentId === d.id && s.chipTxtOn]}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Field lbl="Basic salary (PKR) *" val={String(form.basicSalary)} on={set("basicSalary")} kb="numeric" />
            <Field lbl="Email (staff signs in with this)" val={form.email} on={set("email")} kb="email-address" />
            <Field lbl="Phone" val={form.phone} on={set("phone")} kb="phone-pad" />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setEditing(null)}>
                <Text style={s.btnGhostTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={save} disabled={busy}>
                {busy ? <ActivityIndicator color="#04201C" /> : <Text style={s.btnTxt}>Save employee</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Department modal */}
      <Modal visible={!!editingDept} transparent animationType="slide" onRequestClose={() => setEditingDept(null)}>
        <View style={s.scrim}>
          <View style={[s.sheet, { maxHeight: undefined }]}>
            <Text style={s.sheetH}>{editingDept === "new" ? "Add department" : "Edit department"}</Text>
            <Field lbl="Department name *" val={deptName} on={setDeptName} />
            <View style={{ flexDirection: "row", gap: 12, marginTop: 18 }}>
              <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={() => setEditingDept(null)}>
                <Text style={s.btnGhostTxt}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.btn, { flex: 1 }]} onPress={saveDept} disabled={busy}>
                {busy ? <ActivityIndicator color="#04201C" /> : <Text style={s.btnTxt}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Field({ lbl, val, on, ph, kb }) {
  return (
    <>
      <Text style={s.lbl}>{lbl}</Text>
      <TextInput style={s.input} value={val || ""} onChangeText={on}
        placeholder={ph} placeholderTextColor={C.muted} keyboardType={kb} autoCapitalize="none" />
    </>
  );
}

const s = StyleSheet.create({
  h1: { fontSize: 24, fontWeight: "800", color: C.ink, letterSpacing: -0.5, marginBottom: 14 },
  segment: { flexDirection: "row", backgroundColor: "#E4E9F2", borderRadius: R.pill, padding: 4, marginBottom: 16 },
  segBtn: { flex: 1, paddingVertical: 9, borderRadius: R.pill, alignItems: "center" },
  segOn: { backgroundColor: C.card },
  segTxt: { fontSize: 13.5, fontWeight: "700", color: C.muted },
  segTxtOn: { color: C.ink },
  card: { backgroundColor: C.card, borderRadius: R.card, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: "#E0F7F2", alignItems: "center", justifyContent: "center" },
  avatarTxt: { fontWeight: "800", fontSize: 14, color: C.primaryDark },
  name: { fontSize: 15.5, fontWeight: "800", color: C.ink },
  meta: { fontSize: 12.5, color: C.muted, marginTop: 2 },
  edit: { fontSize: 13, fontWeight: "800", color: C.primaryDark },
  fab: { position: "absolute", bottom: 20, left: 18, right: 18, height: 52, backgroundColor: C.primary, borderRadius: R.pill, alignItems: "center", justifyContent: "center" },
  fabTxt: { fontWeight: "800", fontSize: 15.5, color: "#04201C" },
  scrim: { flex: 1, backgroundColor: "rgba(15,20,32,0.5)", justifyContent: "flex-end" },
  sheet: { backgroundColor: C.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, maxHeight: "88%" },
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
  errBox: { backgroundColor: C.dangerSoft, borderRadius: 10, padding: 11, marginTop: 8 },
  errTxt: { color: C.danger, fontSize: 13 },
});
