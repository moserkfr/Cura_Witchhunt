function SettingsPage() {
  return (

    <div className="grid grid-cols-2 gap-6">

      <div className="bg-white/50 rounded-[30px] p-8 shadow-xl">

        <h2 className="text-2xl font-semibold text-purple-900 mb-6">
          Privacy Controls
        </h2>

        <div className="space-y-4 text-purple-700">

          <p>✔ No raw chat storage</p>

          <p>✔ Encrypted processing enabled</p>

          <p>✔ Limited data access</p>

        </div>

      </div>

      <div className="bg-white/50 rounded-[30px] p-8 shadow-xl">

        <h2 className="text-2xl font-semibold text-purple-900 mb-6">
          Alert Preferences
        </h2>

        <div className="space-y-4 text-purple-700">

          <p>✔ High-risk alerts</p>

          <p>✔ Weekly summaries</p>

          <p>✔ Emergency notifications</p>

        </div>

      </div>

    </div>

  )
}

export default SettingsPage