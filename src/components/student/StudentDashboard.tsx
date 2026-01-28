import { useWallet } from '../../hooks/useWallet'
import { useExamHistory } from '../../hooks/useExamHistory'
import type { ExamResult } from '../../hooks/useExamHistory'

interface StudentDashboardProps {
  onJoinRoom: () => void
}

function formatDate(timestamp: bigint): string {
  return new Date(Number(timestamp) * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatGrade(grade: bigint): string {
  // Grade is stored as value out of 10000 (e.g., 8750 = 87.50%)
  return (Number(grade) / 100).toFixed(2) + '%'
}

function ExamCard({ exam }: { exam: ExamResult }) {
  const gradePercent = Number(exam.grade) / 100

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{exam.examName || 'Unnamed Exam'}</h3>
          <p className="text-sm text-gray-500">Room: {exam.roomId}</p>
        </div>
        {exam.nftMinted && (
          <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
            NFT Minted
          </span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Grade</span>
            <span className="font-semibold text-gray-800">{formatGrade(exam.grade)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${
                gradePercent >= 70 ? 'bg-green-500' :
                gradePercent >= 50 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(gradePercent, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between text-sm text-gray-500">
        <span>Taken: {formatDate(exam.createdAt)}</span>
        <span>{exam.recordings?.length || 0} recordings</span>
      </div>

      {exam.recordings && exam.recordings.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-2">Recordings:</p>
          <div className="flex flex-wrap gap-2">
            {exam.recordings.map((cid, idx) => (
              <a
                key={idx}
                href={`https://ipfs.io/ipfs/${cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition-colors"
              >
                Recording {idx + 1}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
      <div className="flex items-center gap-4">
        <div className="text-3xl">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-800">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

export default function StudentDashboard({ onJoinRoom }: StudentDashboardProps) {
  const { address, formatAddress } = useWallet()
  const { examResults, stats, isLoading, error } = useExamHistory(address || undefined)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-600">Loading your exam history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-12 text-center">
            <p className="text-red-600">Error loading exam history: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 mb-6 shadow-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Student Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Wallet: <span className="font-mono">{formatAddress(address)}</span>
              </p>
            </div>
            <button
              onClick={onJoinRoom}
              className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              Join New Exam
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Exams Taken" value={stats.totalExams} icon="📝" />
          <StatCard label="Completed" value={stats.completedExams} icon="✅" />
          <StatCard label="Recordings" value={stats.totalRecordings} icon="🎥" />
          <StatCard
            label="Avg. Grade"
            value={stats.totalExams > 0 ? `${stats.averageGrade.toFixed(1)}%` : '-'}
            icon="📊"
          />
        </div>

        {/* Exam History */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Exam History</h2>

          {examResults.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No exams yet</h3>
              <p className="text-gray-500 mb-6">
                You haven't taken any exams yet. Join a room to get started!
              </p>
              <button
                onClick={onJoinRoom}
                className="px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/40 transition-all"
              >
                Join Your First Exam
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {examResults.map((exam) => (
                <ExamCard key={exam.id.toString()} exam={exam} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
