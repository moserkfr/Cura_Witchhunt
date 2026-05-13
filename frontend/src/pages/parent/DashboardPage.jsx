import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export default function DashboardPage({ selectedChild }) {

  const screenTimeData = [
    { day: "Mon", hours: 4 },
    { day: "Tue", hours: 5 },
    { day: "Wed", hours: 3 },
    { day: "Thu", hours: 6 },
    { day: "Fri", hours: 7 },
    { day: "Sat", hours: 8 },
    { day: "Sun", hours: 5 },
  ]

  const glass = "bg-white/40 backdrop-blur-xl border border-white/30 shadow-md rounded-3xl"

  const riskColor =
    selectedChild?.risk === "Safe"
      ? "bg-green-100 text-green-800"
      : selectedChild?.risk === "High Risk"
      ? "bg-red-100 text-red-800"
      : "bg-purple-100 text-purple-800"

  const highRiskAlerts = (selectedChild?.alerts || []).filter(a => a.severity === "High")
  const totalAlerts = (selectedChild?.alerts || []).length

  return (
    <div className="w-full h-full flex justify-center px-4 py-6 bg-gradient-to-br from-[#bde0fe] to-[#ba9fe7]">

      <div className="w-full max-w-6xl space-y-6">

        {/* HERO */}
        <div className={`${glass} p-6`}>
          <h1 className="text-3xl font-bold text-[#6b4fa3]">
            Hello, Parent 👋
          </h1>
          <p className="text-[#5b6b7a] mt-2">
            Monitoring <b>{selectedChild?.name}</b>'s digital wellbeing in real time
          </p>
          <div className="mt-4 flex gap-3 flex-wrap">
            <div className={`px-4 py-2 rounded-full text-sm border border-white/40 font-semibold ${riskColor}`}>
              Risk Level: {selectedChild?.risk}
            </div>
            <div className="px-4 py-2 rounded-full bg-[#bde0fe]/40 text-[#3b5b7a] text-sm border border-white/40">
              Risk Score: {selectedChild?.riskScore}/100
            </div>
            <div className="px-4 py-2 rounded-full bg-green-100 text-green-800 text-sm border border-white/40">
              AI Monitoring: Active
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* ANALYTICS */}
          <div className={`lg:col-span-2 ${glass} p-5`}>
            <h2 className="font-semibold text-[#6b4fa3] mb-3">
              Analytics Overview
            </h2>
            <div className="flex justify-between text-sm text-[#5b6b7a] mb-3">
              <p>Child: <b>{selectedChild?.name}</b></p>
              <p>Stress Level: <b>{selectedChild?.stressLevel}</b></p>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={screenTimeData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" stroke="#5b6b7a" />
                  <YAxis stroke="#5b6b7a" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="hours"
                    stroke="#ba9fe7"
                    strokeWidth={3}
                    dot={{ fill: "#bde0fe", r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SAFETY */}
          <div className={`${glass} p-5`}>
            <h2 className="font-semibold text-[#6b4fa3] mb-3">
              Safety Control
            </h2>
            <div className="space-y-3 text-sm">
              <div className="p-3 rounded-2xl bg-[#ba9fe7]/20 text-[#5b2d8e] border border-white/40">
                ⚠ Total Alerts: {totalAlerts}
              </div>
              <div className="p-3 rounded-2xl bg-red-50 text-red-700 border border-red-100">
                🔴 High Risk Alerts: {highRiskAlerts.length}
              </div>
              <div className="p-3 rounded-2xl bg-white/30 text-[#6b4fa3] border border-white/40">
                🤖 AI Risk Engine: Active
              </div>
            </div>
          </div>

        </div>

        {/* LOWER GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* RECENT ALERTS */}
          <div className={`${glass} p-5`}>
            <h2 className="font-semibold text-[#6b4fa3] mb-3">
              Recent Alerts
            </h2>
            {(selectedChild?.alerts || []).length === 0 ? (
              <p className="text-sm text-[#5b6b7a]">No alerts detected yet.</p>
            ) : (
              <div className="space-y-2">
                {(selectedChild?.alerts || []).slice(0, 3).map((alert, i) => (
                  <div key={i} className="bg-white/40 p-3 rounded-xl border border-white/30">
                    <p className="text-xs font-semibold text-[#5b2d8e]">{alert.title}</p>
                    <p className="text-xs text-[#5b6b7a] mt-1">{alert.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CHILD INFO */}
          <div className={`${glass} p-5`}>
            <h2 className="font-semibold text-[#6b4fa3] mb-3">
              Child Overview
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#5b6b7a]">Username</span>
                <span className="font-semibold text-[#6b4fa3]">{selectedChild?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b6b7a]">Risk Score</span>
                <span className="font-semibold text-[#6b4fa3]">{selectedChild?.riskScore}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b6b7a]">Stress Level</span>
                <span className="font-semibold text-[#6b4fa3]">{selectedChild?.stressLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b6b7a]">Total Flags</span>
                <span className="font-semibold text-[#6b4fa3]">{totalAlerts}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}