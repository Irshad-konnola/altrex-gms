// // src/app/(dashboard)/attendance/page.tsx
// import { LiveFeed } from "@/components/attendance/LiveFeed"
// import { ManualCheckin } from "@/components/attendance/ManualCheckin"
// import { Users, Clock } from "lucide-react"

// export default function AttendancePage() {
//   return (
//     <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
//       {/* Header Section */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-2xl font-bold text-white">Attendance & Logs</h1>
//           <p className="text-dark-300 text-sm mt-1">Real-time check-ins and gym footfall.</p>
//         </div>
//         <ManualCheckin />
//       </div>

//       {/* Main Grid Layout */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
//         {/* Left Column: Live Feed (Takes up 2/3 width on desktop) */}
//         <div className="lg:col-span-2">
//           <LiveFeed />
//         </div>
        
//         {/* Right Column: Stats & Charts */}
//         <div className="space-y-6">
          
//           {/* Today's Overview Widget */}
//           <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 shadow-sm">
//             <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider text-dark-300">
//               Today's Overview
//             </h3>
//             <div className="space-y-4">
//               <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-dark-700/50">
//                 <div className="flex items-center gap-3 text-dark-200">
//                   <Users className="w-5 h-5 text-gold-500" />
//                   <span className="font-medium">Total Footfall</span>
//                 </div>
//                 {/* This will be wired up to a real count next */}
//                 <span className="text-xl font-bold text-white">--</span>
//               </div>
//               <div className="flex items-center justify-between p-3 bg-dark-900/50 rounded-lg border border-dark-700/50">
//                 <div className="flex items-center gap-3 text-dark-200">
//                   <Clock className="w-5 h-5 text-gold-500" />
//                   <span className="font-medium">Peak Hour</span>
//                 </div>
//                 <span className="text-xl font-bold text-white">--</span>
//               </div>
//             </div>
//           </div>

//           {/* Hourly Chart Placeholder */}
//           <div className="bg-dark-800 border border-dark-600 rounded-xl p-6 h-64 flex flex-col items-center justify-center text-dark-400 shadow-sm">
//             <Clock className="w-8 h-8 mb-3 opacity-20" />
//             <span className="text-sm font-medium">Hourly Chart Data</span>
//             <span className="text-xs mt-1">Check-in distribution</span>
//           </div>
          
//         </div>
//       </div>
//     </div>
//   )
// }


// src/app/(dashboard)/attendance/page.tsx
import { LiveFeed } from "@/components/attendance/LiveFeed"
import { ManualCheckin } from "@/components/attendance/ManualCheckin"
import { AttendanceStats } from "@/components/attendance/AttendanceStats"

export default function AttendancePage() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-8">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Attendance & Logs</h1>
          <p className="text-dark-300 text-sm mt-1">Real-time check-ins and gym footfall.</p>
        </div>
        <ManualCheckin />
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Live Feed (Takes up 2/3 width on desktop) */}
        <div className="lg:col-span-2">
          <LiveFeed />
        </div>
        
        {/* Right Column: Dynamic Stats & Charts */}
        <div className="lg:col-span-1">
          <AttendanceStats />
        </div>
        
      </div>
    </div>
  )
}