import { useState } from "react"

import {
  MessageCircle,
  X,
} from "lucide-react"

function AIAssistant() {

  const [isOpen, setIsOpen] = useState(false)

  return (

    <>

      {/* FLOATING BUTTON */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-[#9333ea] text-white shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-50"
      >

        <MessageCircle size={28} />

      </button>

      {/* POPUP */}
      {isOpen && (

        <div className="fixed bottom-28 right-8 w-[380px] bg-white rounded-[30px] shadow-2xl overflow-hidden z-50 border border-purple-100">

          {/* HEADER */}
          <div className="bg-gradient-to-r from-[#ba9fe7] to-[#9333ea] p-5 text-white flex justify-between items-center">

            <div>

              <h2 className="text-xl font-semibold">
                CURA AI Assistant
              </h2>

              <p className="text-sm opacity-80 mt-1">
                Smart wellbeing guidance
              </p>

            </div>

            <button
              onClick={() => setIsOpen(false)}
            >

              <X size={24} />

            </button>

          </div>

          {/* CONTENT */}
          <div className="p-6 space-y-5">

            {/* MESSAGE */}
            <div className="bg-purple-50 p-4 rounded-2xl text-purple-700">

              Would you like help understanding emotional stress alerts?

            </div>

            {/* SUGGESTIONS */}
            <div className="space-y-3">

              <button className="w-full text-left bg-white border border-purple-100 hover:bg-purple-50 transition-all p-4 rounded-2xl text-purple-700">

                Explain current safety risks

              </button>

              <button className="w-full text-left bg-white border border-purple-100 hover:bg-purple-50 transition-all p-4 rounded-2xl text-purple-700">

                Parenting recommendations

              </button>

              <button className="w-full text-left bg-white border border-purple-100 hover:bg-purple-50 transition-all p-4 rounded-2xl text-purple-700">

                Analyze emotional wellbeing trends

              </button>

            </div>

            {/* INPUT */}
            <div className="flex items-center gap-3 pt-2">

              <input
                type="text"
                placeholder="Ask CURA AI..."
                className="flex-1 bg-purple-50 rounded-2xl px-5 py-4 outline-none text-purple-700"
              />

              <button className="bg-[#9333ea] text-white px-5 py-4 rounded-2xl hover:scale-105 transition-all">

                Send

              </button>

            </div>

          </div>

        </div>

      )}

    </>

  )
}

export default AIAssistant