import { Search, Bell } from "lucide-react"
import { motion } from "framer-motion"

function Topbar({
  activePage,
  selectedChild,
  searchTerm,
  setSearchTerm,
  showNotifications,
  setShowNotifications,
  parent, // ✅ NEW
}) {

  const getTitle = () => {
    switch (activePage) {
      case "dashboard":
        return "Dashboard Overview"
      case "analytics":
        return "Digital Wellbeing Analytics"
      case "alerts":
        return "Safety Alerts"
      case "safety":
        return "Child Safety Status"
      case "settings":
        return "Settings"
      default:
        return "Dashboard"
    }
  }

  return (

    <div className="flex justify-between items-start mb-8">

      {/* LEFT TITLE SECTION */}
      <div>

        <h1 className="text-4xl font-bold text-purple-900 tracking-tight">
          {getTitle()}
        </h1>

        <p className="text-purple-500 mt-2 text-sm">
          Monitoring {selectedChild.name}'s digital wellbeing
        </p>

        {/* 🔍 SEARCH STATUS (MAKES SEARCH "DO SOMETHING") */}
        {searchTerm && (
          <p className="text-xs text-purple-400 mt-1">
            Searching for: <span className="font-medium">{searchTerm}</span>
          </p>
        )}

      </div>

      {/* RIGHT CONTROLS */}
      <div className="flex items-center gap-4">

        {/* SEARCH */}
        <div className="flex items-center gap-2 bg-white/60 px-4 py-3 rounded-2xl shadow-md border border-white/30 w-[240px]">

          <Search size={16} className="text-purple-400" />

          <input
            type="text"
            placeholder="Search alerts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-transparent outline-none text-sm text-purple-700 w-full placeholder:text-purple-400"
          />

        </div>

        {/* NOTIFICATIONS */}
        <div className="relative">

          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-white/60 p-3 rounded-2xl shadow-md hover:scale-105 transition border border-white/30"
          >

            <Bell className="text-purple-700" size={18} />

            {/* BADGE */}
            <span className="absolute -top-1 -right-1 bg-[#7c3aed] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">

              {selectedChild.notifications.length}

            </span>

          </button>

          {/* DROPDOWN */}
          {showNotifications && (

            <div className="absolute right-0 mt-3 w-[280px] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-50">

              <h2 className="text-sm font-semibold text-purple-900 mb-3">
                Notifications
              </h2>

              <div className="space-y-2 max-h-[220px] overflow-y-auto">

                {selectedChild.notifications.map((note, index) => (

                  <div
                    key={index}
                    className="bg-purple-50 p-3 rounded-xl text-purple-700 text-sm"
                  >
                    {note}
                  </div>

                ))}

              </div>

            </div>

          )}

        </div>

        {/* PROFILE (NOW DYNAMIC PARENT PROFILE) */}
        <div className="flex items-center gap-3 bg-white/60 px-4 py-2.5 rounded-2xl shadow-md border border-white/30">

          <img
            src={parent?.avatar || "https://i.pravatar.cc/100"}
            alt="profile"
            className="w-10 h-10 rounded-full"
          />

          <div className="leading-tight">

            <h3 className="text-purple-900 font-semibold text-sm">
              {parent?.name || "Parent"}
            </h3>

            <p className="text-xs text-purple-500">
              {parent?.role || "Parent Account"}
            </p>

          </div>

        </div>

      </div>

    </div>

  )
}

export default Topbar