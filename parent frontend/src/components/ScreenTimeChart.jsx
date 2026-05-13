import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

const data = [
  { day: "Mon", hours: 4 },
  { day: "Tue", hours: 6 },
  { day: "Wed", hours: 5 },
  { day: "Thu", hours: 8 },
  { day: "Fri", hours: 7 },
]

function ScreenTimeChart() {

  return (

    <div className="w-full h-[220px]">

      <ResponsiveContainer width="100%" height="100%">

        <BarChart data={data}>

          <XAxis dataKey="day" />

          <Tooltip />

          <Bar
            dataKey="hours"
            fill="#9333ea"
            radius={[20, 20, 0, 0]}
          />

        </BarChart>

      </ResponsiveContainer>

    </div>

  )
}

export default ScreenTimeChart