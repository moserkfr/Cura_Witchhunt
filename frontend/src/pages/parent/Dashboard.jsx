import AnalyticsPage from "./AnalyticsPage"
import AlertsPage from "./AlertsPage"
import SafetyPage from "./SafetyPage"
import SettingsPage from "./SettingsPage"
import DashboardPage from "./DashboardPage"
import Sidebar from "../../components/Sidebar"
import Topbar from "../../components/Topbar"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

function Dashboard({ onLogout }) {

  const [activePage, setActivePage] = useState("dashboard")
  const [children, setChildren] = useState([])
  const [selectedChild, setSelectedChild] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showNotifications, setShowNotifications] = useState(false)
  const [aiThinking, setAiThinking] = useState(true)
  const [emergencyMode, setEmergencyMode] = useState(false)
  const [showGuidance, setShowGuidance] = useState(false)
  const [loading, setLoading] = useState(true)

  const user = JSON.parse(localStorage.getItem("cura_user") || "{}")
  const parentEmail = user.email || user.username

  const parent = {
    name: user.name || "Parent",
    role: "Parent",
    avatar: "https://i.pravatar.cc/100"
  }

  // fetch real children from backend
  useEffect(() => {
    const fetchChildren = async () => {
      try {
        const res = await fetch(`http://localhost:8000/parent/children?parent_email=${parentEmail}`)
        const data = await res.json()
        if (data.length > 0) {
          setChildren(data)
          setSelectedChild(data[0])
        }
      } catch (err) {
        console.error("Failed to fetch children:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchChildren()

    // refresh every 30 seconds to pick up new messages
    const interval = setInterval(fetchChildren, 30000)
    return () => clearInterval(interval)
  }, [parentEmail])

  useEffect(() => {
    const interval = setInterval(() => {
      setAiThinking(true)
      setTimeout(() => setAiThinking(false), 1200)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  const triggerEmergency = () => {
    setEmergencyMode(true)
    const audio = new Audio("https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg")
    audio.play()
    setTimeout(() => setEmergencyMode(false), 6000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#ede9fe] to-[#dbeafe] flex items-center justify-center">
        <p className="text-purple-700 text-xl font-semibold">Loading dashboard...</p>
      </div>
    )
  }

  if (!selectedChild) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#5687b1] via-[#958ac8] to-[#7151a1] flex flex-col items-center justify-center gap-8">
        
        <div className="bg-white/40 backdrop-blur-xl border border-white/30 rounded-[40px] shadow-2xl p-16 flex flex-col items-center gap-6 max-w-lg w-full mx-6">
          
          <div className="text-6xl">👨‍👧</div>
          
          <h1 className="text-4xl font-black text-purple-900 text-center leading-tight">
            No Children Linked
          </h1>
          
          <p className="text-purple-500 text-lg text-center leading-relaxed">
            Ask your child to sign up using your email address as their parent email.
          </p>

          <button
            onClick={onLogout}
            className="w-full mt- py-5 bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-2xl text-xl font-bold shadow-lg hover:scale-105 transition-transform"
          >
            ← Back to Login
          </button>

        </div>

      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3e8ff] via-[#ede9fe] to-[#dbeafe] p-6">

      {emergencyMode && (
        <div className="fixed inset-0 bg-red-600/90 flex items-center justify-center z-50">
          <div className="w-[600px] bg-red-700/40 backdrop-blur-xl rounded-3xl p-10 text-white shadow-2xl space-y-6">
            <div className="text-center text-5xl animate-pulse">⚠️</div>
            <h1 className="text-4xl font-bold text-center">EMERGENCY MODE ACTIVE</h1>
            <p className="text-center text-lg">High-risk behavior detected for <b>{selectedChild.name}</b></p>
            <p className="text-center opacity-80">Immediate parental attention recommended</p>
            <div className="space-y-3">
              <button onClick={() => alert("Calling emergency contact...")}
                className="w-full bg-white text-red-600 py-3 rounded-xl font-semibold hover:scale-105 transition">
                Call Emergency Contact
              </button>
              <button onClick={() => setShowGuidance(!showGuidance)}
                className="w-full bg-red-800/60 py-3 rounded-xl font-semibold hover:scale-105 transition">
                View Guidance Steps
              </button>
              <button onClick={() => setEmergencyMode(false)}
                className="w-full bg-black/30 py-3 rounded-xl font-semibold hover:scale-105 transition">
                Return to Dashboard
              </button>
            </div>
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

      <div className="w-full h-[95vh] bg-white/40 backdrop-blur-xl rounded-[40px] border border-white/30 shadow-2xl flex overflow-hidden">

        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          selectedChild={selectedChild}
          setSelectedChild={setSelectedChild}
          children={children}
          onLogout={onLogout}
        />

        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
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