function DashboardPage({ selectedChild }) {

  const riskColor =
    selectedChild.risk === "Safe"
      ? "from-blue-200 to-blue-100 text-blue-800"
      : selectedChild.risk === "High Risk"
      ? "from-red-200 to-red-100 text-red-800"
      : "from-purple-200 to-purple-100 text-purple-800"

  return (

    <div className="space-y-6">

      {/* TOP SUMMARY GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* CHILD STATUS CARD */}
        <div className="col-span-1 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-purple-900 font-semibold text-lg mb-4">
            Child Overview
          </h2>

          <div className="flex items-center gap-4">

            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#bde0fe] to-[#a78bfa] flex items-center justify-center text-xl font-bold text-purple-900">

              {selectedChild.name.charAt(0)}

            </div>

            <div>

              <h3 className="text-xl font-bold text-purple-900">
                {selectedChild.name}
              </h3>

              <p className="text-purple-500 text-sm">
                Age {selectedChild.age}
              </p>

            </div>

          </div>

          <div className="mt-5 space-y-3">

            <div className="flex justify-between text-sm">

              <span className="text-purple-500">Risk Level</span>

              <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${riskColor}`}>

                {selectedChild.risk}

              </span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-purple-500">Risk Score</span>

              <span className="font-semibold text-purple-900">

                {selectedChild.riskScore}/100

              </span>

            </div>

            <div className="flex justify-between text-sm">

              <span className="text-purple-500">Stress Level</span>

              <span className="font-semibold text-purple-900">

                {selectedChild.stressLevel}

              </span>

            </div>

          </div>

        </div>

        {/* AI INSIGHT CARD */}
        <div className="col-span-2 bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-purple-900 font-semibold text-lg mb-4">
            AI Insight Summary
          </h2>

          <div className="space-y-4">

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">

              <p className="text-blue-800 text-sm">
                Increased late-night activity detected over the past 3 days.
              </p>

            </div>

            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">

              <p className="text-purple-800 text-sm">
                Emotional fluctuations suggest mild stress patterns but no critical risk.
              </p>

            </div>

            <div className="bg-white/70 p-4 rounded-2xl border border-gray-100">

              <p className="text-purple-700 text-sm">
                Recommendation: Maintain open communication and monitor sleep schedule consistency.
              </p>

            </div>

          </div>

        </div>

      </div>

      {/* ANALYTICS + ALERT SUMMARY */}
      <div className="grid grid-cols-2 gap-6">

        {/* QUICK METRICS */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-purple-900 font-semibold text-lg mb-5">
            Activity Snapshot
          </h2>

          <div className="space-y-4">

            <div className="flex justify-between">

              <span className="text-purple-500">Screen Time</span>

              <span className="text-purple-900 font-semibold">5h 20m</span>

            </div>

            <div className="flex justify-between">

              <span className="text-purple-500">Night Activity</span>

              <span className="text-purple-900 font-semibold">High</span>

            </div>

            <div className="flex justify-between">

              <span className="text-purple-500">App Usage Diversity</span>

              <span className="text-purple-900 font-semibold">Medium</span>

            </div>

          </div>

        </div>

        {/* ALERT PREVIEW */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-purple-900 font-semibold text-lg mb-5">
            Recent Alerts
          </h2>

          <div className="space-y-3">

            {selectedChild.alerts.slice(0, 2).map((alert, index) => (

              <div
                key={index}
                className="p-4 rounded-2xl bg-gradient-to-r from-[#bde0fe]/40 to-[#a78bfa]/30 border border-white/30"
              >

                <h3 className="text-purple-900 font-semibold text-sm">
                  {alert.title}
                </h3>

                <p className="text-purple-700 text-xs mt-1">
                  {alert.description}
                </p>

              </div>

            ))}

          </div>

        </div>

      </div>

    </div>

  )
}

export default DashboardPage