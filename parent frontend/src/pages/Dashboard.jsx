import AnalyticsPage from "../components/AnalyticsPage"
import AlertsPage from "../components/AlertsPage"
import SafetyPage from "../components/SafetyPage"
import SettingsPage from "../components/SettingsPage"
import DashboardPage from "../components/DashboardPage"
import Sidebar from "../components/Sidebar"
import Topbar from "../components/Topbar"

import children from "../data/children"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

function Dashboard() {

  const [activePage, setActivePage] = useState("dashboard")
  const [selectedChild, setSelectedChild] = useState(children[0])
  const [searchTerm, setSearchTerm] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)

  const [aiThinking, setAiThinking] = useState(true)
  const [emergencyMode, setEmergencyMode] = useState(false)

  const [showGuidance, setShowGuidance] = useState(false)

  // 👤 Parent Profile (NEW)
  const parent = {
    name: "Sophia",
    role: "Parent",
    avatar: "https://i.pravatar.cc/100"
  }

  useEffect(() => {

    const interval = setInterval(() => {
      setAiThinking(true)

      setTimeout(() => {
        setAiThinking(false)
      }, 1200)

    }, 6000)

    return () => clearInterval(interval)

  }, [])

  const triggerEmergency = () => {
    setEmergencyMode(true)

    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
    audio.play()

    setTimeout(() => {
      setEmergencyMode(false)
    }, 6000)
  }

  return (

    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#ede9fe] to-[#dbeafe] p-6">

      {/* EMERGENCY OVERLAY */}
      {emergencyMode && (
        <div className="fixed inset-0 bg-red-600/90 flex items-center justify-center z-50">

          <div className="w-[600px] bg-red-700/40 backdrop-blur-xl rounded-3xl p-10 text-white shadow-2xl space-y-6">

            <div className="text-center text-5xl animate-pulse">⚠️</div>

            <h1 className="text-4xl font-bold text-center">
              EMERGENCY MODE ACTIVE
            </h1>

            <p className="text-center text-lg">
              High-risk behavior detected for <b>{selectedChild.name}</b>
            </p>

            <p className="text-center opacity-80">
              Immediate parental attention recommended
            </p>

            {/* ACTIONS */}
            <div className="space-y-3">

              <button
                onClick={() => alert("Calling emergency contact...")}
                className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:scale-105 transition"
              >
                Call Emergency Contact
              </button>

              <button
                onClick={() => setShowGuidance(!showGuidance)}
                className="w-full bg-red-800/60 py-3 rounded-xl font-semibold hover:scale-105 transition"
              >
                View Guidance Steps
              </button>

              <button
                onClick={() => setEmergencyMode(false)}
                className="w-full bg-black/30 py-3 rounded-xl font-semibold hover:scale-105 transition"
              >
                Return to Dashboard
              </button>

            </div>

            {/* GUIDANCE */}
            {showGuidance && (
              <div className="bg-white/10 p-4 rounded-2xl text-sm space-y-2">
                <p>• Stay calm and avoid confrontation</p>
                <p>• Talk to your child gently</p>
                <p>• Observe emotional patterns</p>
                <p>• Consider professional support if needed</p>
              </div>
            )}

          </div>

        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="w-full h-[95vh] bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/30 shadow-2xl flex overflow-hidden">

        {/* SIDEBAR */}
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          selectedChild={selectedChild}
          setSelectedChild={setSelectedChild}
        />

        {/* MAIN CONTENT */}
        <div className="flex-1 p-10 overflow-y-auto">

          {/* TOPBAR */}
          <Topbar
            activePage={activePage}
            selectedChild={selectedChild}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            aiThinking={aiThinking}
            triggerEmergency={triggerEmergency}
            parent={parent}
          />

          {/* PAGE CONTENT */}
          <AnimatePresence mode="wait">

            {activePage === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DashboardPage selectedChild={selectedChild} />
              </motion.div>
            )}

            {activePage === "analytics" && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnalyticsPage selectedChild={selectedChild} />
              </motion.div>
            )}

            {activePage === "alerts" && (
              <motion.div key="alerts" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AlertsPage selectedChild={selectedChild} searchTerm={searchTerm} />
              </motion.div>
            )}

            {activePage === "safety" && (
              <motion.div key="safety" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SafetyPage selectedChild={selectedChild} />
              </motion.div>
            )}

            {activePage === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SettingsPage />
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </div>

    </div>

  )
}

export default Dashboard