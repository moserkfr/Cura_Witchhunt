function AlertsPage({ selectedChild, searchTerm }) {

  const alerts = selectedChild.alerts || []

  const filteredAlerts = alerts.filter((a) =>
    a.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getColor = (severity) => {
    switch (severity) {
      case "High":
        return "bg-red-50 text-red-700 border-red-100"
      case "Moderate":
        return "bg-purple-50 text-purple-700 border-purple-100"
      default:
        return "bg-blue-50 text-blue-700 border-blue-100"
    }
  }

  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

        <h2 className="text-2xl font-bold text-purple-900">
          Safety Alerts & Incidents
        </h2>

        <p className="text-purple-500 text-sm mt-1">
          AI-detected behavioral and emotional risk signals
        </p>

      </div>

      {/* ALERT TIMELINE */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

        <h3 className="text-lg font-semibold text-purple-900 mb-6">
          Incident Timeline
        </h3>

        <div className="space-y-5">

          {filteredAlerts.length === 0 ? (

            <p className="text-purple-500 text-sm">
              No alerts matching your search.
            </p>

          ) : (

            filteredAlerts.map((alert, index) => (

              <div
                key={index}
                className={`p-5 rounded-2xl border ${getColor(alert.severity)} shadow-sm`}
              >

                {/* TITLE + SEVERITY */}
                <div className="flex justify-between items-start">

                  <h4 className="text-lg font-semibold">
                    {alert.title}
                  </h4>

                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/70">
                    {alert.severity}
                  </span>

                </div>

                {/* DESCRIPTION */}
                <p className="text-sm mt-3 opacity-90">
                  {alert.description}
                </p>

                {/* AI TAG */}
                <div className="mt-4 text-xs text-gray-500">
                  AI Confidence: High • Behavior-based inference
                </div>

              </div>

            ))

          )}

        </div>

      </div>

      {/* AI SAFETY SUMMARY */}
      <div className="grid grid-cols-3 gap-6">

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[24px] p-5 shadow-lg">

          <p className="text-purple-500 text-sm">Total Alerts</p>
          <h3 className="text-2xl font-bold text-purple-900 mt-1">
            {alerts.length}
          </h3>

        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[24px] p-5 shadow-lg">

          <p className="text-purple-500 text-sm">Risk Level</p>
          <h3 className="text-2xl font-bold text-purple-900 mt-1">
            {selectedChild.risk}
          </h3>

        </div>

        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[24px] p-5 shadow-lg">

          <p className="text-purple-500 text-sm">AI Status</p>
          <h3 className="text-2xl font-bold text-purple-900 mt-1">
            Monitoring
          </h3>

        </div>

      </div>

    </div>

  )
}

export default AlertsPage