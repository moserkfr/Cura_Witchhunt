function StatCard({ title, value, color }) {

  return (

    <div className="bg-white/50 rounded-[30px] p-8 shadow-xl">

      <h2 className="text-purple-900 text-xl font-semibold mb-4">
        {title}
      </h2>

      <h1
        className="text-5xl font-bold"
        style={{ color }}
      >
        {value}
      </h1>

    </div>

  )
}

export default StatCard