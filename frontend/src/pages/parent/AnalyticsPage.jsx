import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts"

function AnalyticsPage() {

  const screenTimeData = [
    { day: "Mon", hours: 4 },
    { day: "Tue", hours: 5 },
    { day: "Wed", hours: 3 },
    { day: "Thu", hours: 6 },
    { day: "Fri", hours: 7 },
    { day: "Sat", hours: 8 },
    { day: "Sun", hours: 5 },
  ]

  const moodData = [
    { day: "Mon", mood: 70 },
    { day: "Tue", mood: 65 },
    { day: "Wed", mood: 50 },
    { day: "Thu", mood: 45 },
    { day: "Fri", mood: 60 },
    { day: "Sat", mood: 75 },
    { day: "Sun", mood: 68 },
  ]

  return (

    <div className="space-y-6">

      {/* HEADER */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

        <h2 className="text-3xl font-bold text-purple-900">
          Analytics Overview
        </h2>

        <p className="text-purple-500 mt-1 text-sm">
          AI-powered screen time and emotional behavior tracking
        </p>

      </div>

      {/* TOP GRID */}
      <div className="grid grid-cols-2 gap-6">

        {/* SCREEN TIME CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-xl font-semibold text-purple-900 mb-5">
            Screen Time Analytics
          </h2>

          <div className="bg-gradient-to-br from-[#f5f3ff] to-[#e0f2fe] rounded-2xl p-4">

            <ResponsiveContainer width="100%" height={260}>

              <BarChart data={screenTimeData}>

                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

                <XAxis dataKey="day" />

                <YAxis />

                <Tooltip />

                <Bar
                  dataKey="hours"
                  fill="#9333ea"
                  radius={[10, 10, 0, 0]}
                />

              </BarChart>

            </ResponsiveContainer>

          </div>

          {/* MINI INSIGHT */}
          <p className="text-sm text-purple-600 mt-4">
            Peak usage observed on Saturday and Friday evenings.
          </p>

        </div>

        {/* SLEEP INSIGHTS CARD */}
        <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

          <h2 className="text-xl font-semibold text-purple-900 mb-5">
            Sleep Pattern Insights
          </h2>

          <div className="space-y-4">

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl text-blue-800 text-sm">
              Late-night usage increased by 18%
            </div>

            <div className="bg-purple-50 border border-purple-100 p-4 rounded-2xl text-purple-800 text-sm">
              Irregular weekend sleep activity detected
            </div>

            <div className="bg-white/70 border border-gray-100 p-4 rounded-2xl text-purple-700 text-sm">
              Average bedtime shifted to 12:45 AM
            </div>

          </div>

        </div>

      </div>

      {/* MOOD CHART FULL WIDTH */}
      <div className="bg-white/60 backdrop-blur-xl border border-white/40 rounded-[28px] p-6 shadow-lg">

        <h2 className="text-xl font-semibold text-purple-900 mb-5">
          Emotional Trend Analysis
        </h2>

        <div className="bg-gradient-to-br from-[#f5f3ff] to-[#e0f2fe] rounded-2xl p-4">

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={moodData}>

              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />

              <XAxis dataKey="day" />

              <YAxis />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="mood"
                stroke="#7c3aed"
                strokeWidth={4}
                dot={{ r: 5 }}
              />

            </LineChart>

          </ResponsiveContainer>

        </div>

        <p className="text-sm text-purple-600 mt-4">
          Emotional stability improves on low screen-time days.
        </p>

      </div>

    </div>

  )
}

export default AnalyticsPage