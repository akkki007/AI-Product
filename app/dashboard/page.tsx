"use client"
import { Button } from '@/components/ui/button'
import { supabase } from '@/utils/supabase'
import React, { useEffect, useState } from 'react'
import { Calendar, Clock, Users, Video, Edit, Trash2, Plus, Download, Play, AlertCircle } from 'lucide-react'

interface ChatUser {
  id: string
  username?: string
  full_name?: string
  avatar_url?: string
  updated_at?: string
}

interface Meeting {
  id: string
  summary: string
  description?: string
  start: {
    dateTime: string
    timeZone: string
  }
  end: {
    dateTime: string
    timeZone: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus: string
  }>
  conferenceData?: {
    conferenceSolution: {
      name: string
    }
    entryPoints: Array<{
      entryPointType: string
      uri: string
    }>
  }
  htmlLink: string
  status: string
}

interface NewMeeting {
  title: string
  description: string
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  attendees: string
}

interface Recording {
  id: string
  name: string
  createdTime: string
  driveId: string
  webViewLink: string
  size: string
  mimeType: string
  thumbnailLink?: string
}

const Page = () => {
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null)
  const [message, setMessage] = useState<string>("Wait for the results")
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [accessToken, setAccessToken] = useState<string>("")
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [activeTab, setActiveTab] = useState<'check' | 'meetings' | 'create' | 'recordings'>('check')
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null)
  const [recordingsError, setRecordingsError] = useState<string>("")
  const [newMeeting, setNewMeeting] = useState<NewMeeting>({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    attendees: ''
  })

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()
        
        if (sessionError) throw sessionError
        
        if (session?.user) {
          const user = session.user
          const userData = {
            id: user.id,
            username: user.user_metadata?.username || user.email?.split("@")[0] || "user",
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
          }
          setCurrentUser(userData)
        }
      } catch (error) {
        console.error("Error fetching session:", error)
        setMessage("Error fetching user session")
      }
    }

    getInitialSession()
  }, [])

  const checkGoogleMeetAccess = async () => {
    setIsLoading(true)
    setMessage("Checking Google Meet access...")
    setRecordingsError("")

    try {
      if (!currentUser) {
        setMessage("Please login first")
        return
      }

      const { data, error } = await supabase
        .from('user_google_tokens')
        .select('*')
        .eq('user_id', currentUser.id)
        .single()

      if (error) {
        console.error("Error fetching Google tokens:", error)
        setMessage("Error fetching Google tokens")
        return
      }

      if (!data) {
        setMessage("No Google tokens found for the user")
        return
      }

      const { access_token } = data

      if (!access_token) {
        setMessage("Google access token is missing")
        return
      }

      setAccessToken(access_token)

      // Test Calendar API access
      const testCalendarAccess = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      })

      // Test Drive API access
      const testDriveAccess = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        }
      })

      const calendarOk = testCalendarAccess.ok
      const driveOk = testDriveAccess.ok

      if (calendarOk && driveOk) {
        setMessage("✅ Google Meet and Drive access available!")
        await fetchMeetings(access_token)
        await fetchRecordings(access_token)
      } else if (calendarOk && !driveOk) {
        setMessage("✅ Google Meet access available, ⚠️ Drive access limited")
        await fetchMeetings(access_token)
        setRecordingsError("Drive access not available. Please ensure Google Drive scope is included in your OAuth setup.")
      } else if (!calendarOk && driveOk) {
        setMessage("⚠️ Calendar access limited, ✅ Drive access available")
        await fetchRecordings(access_token)
      } else {
        setMessage("❌ Both Google Meet and Drive access denied")
      }

    } catch (error) {
      console.error("Error checking Google access:", error)
      setMessage("Error occurred while checking access")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMeetings = async (token: string) => {
    try {
      const now = new Date().toISOString()
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now}&maxResults=50&singleEvents=true&orderBy=startTime`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        const meetingEvents = data.items?.filter((event: any) => 
          event.conferenceData?.conferenceSolution?.name === 'Google Meet'
        ) || []
        setMeetings(meetingEvents)
      }
    } catch (error) {
      console.error("Error fetching meetings:", error)
    }
  }

  const fetchRecordings = async (token: string) => {
    setRecordingsError("")
    
    try {
      // Multiple search strategies for Meet recordings
      const searchQueries = [
        // Search for video files with "Meet" in name
        "mimeType='video/mp4' and (name contains 'Meet' or name contains 'meet')",
        // Search for video files in Meet Recordings folder (if it exists)
        "mimeType='video/mp4' and parents in (select id from drive where name='Meet Recordings')",
        // Search for all video files (broader search)
        "mimeType='video/mp4'",
        // Search for webm files (another Meet recording format)
        "mimeType='video/webm' and (name contains 'Meet' or name contains 'meet')"
      ]

      let allRecordings: Recording[] = []

      for (const query of searchQueries) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,createdTime,webViewLink,size,mimeType,thumbnailLink)&orderBy=createdTime desc&maxResults=50`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          )

          if (response.ok) {
            const data = await response.json()
            if (data.files && data.files.length > 0) {
              // Add unique recordings (avoid duplicates)
              const newRecordings = data.files.filter((file: any) => 
                !allRecordings.some(existing => existing.id === file.id)
              )
              allRecordings.push(...newRecordings)
            }
          } else if (response.status === 403) {
            setRecordingsError("Drive access denied. Please check OAuth scopes include Google Drive access.")
            break
          }
        } catch (queryError) {
          console.error(`Error with query "${query}":`, queryError)
          continue
        }
      }

      // Sort by creation date (newest first)
      allRecordings.sort((a, b) => new Date(b.createdTime).getTime() - new Date(a.createdTime).getTime())
      
      setRecordings(allRecordings)
      
      if (allRecordings.length === 0 && !recordingsError) {
        setRecordingsError("No video recordings found. This could mean no recordings exist or they're stored in a different location.")
      }

    } catch (error) {
      console.error("Error fetching recordings:", error)
      setRecordingsError("Error occurred while fetching recordings")
    }
  }

  const createMeeting = async () => {
    if (!accessToken || !newMeeting.title) return

    try {
      setIsLoading(true)
      const startDateTime = `${newMeeting.startDate}T${newMeeting.startTime}:00`
      const endDateTime = `${newMeeting.endDate}T${newMeeting.endTime}:00`
      
      const attendeesList = newMeeting.attendees
        .split(',')
        .map(email => ({ email: email.trim() }))
        .filter(attendee => attendee.email)

      const eventData = {
        summary: newMeeting.title,
        description: newMeeting.description,
        start: {
          dateTime: startDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        attendees: attendeesList,
        conferenceData: {
          createRequest: {
            requestId: `meet-${Date.now()}`,
            conferenceSolutionKey: {
              type: 'hangoutsMeet'
            }
          }
        }
      }

      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventData)
      })

      if (response.ok) {
        setMessage("✅ Meeting created successfully!")
        setNewMeeting({
          title: '',
          description: '',
          startDate: '',
          startTime: '',
          endDate: '',
          endTime: '',
          attendees: ''
        })
        await fetchMeetings(accessToken)
        setActiveTab('meetings')
      } else {
        const errorData = await response.json()
        console.error("Error creating meeting:", errorData)
        setMessage("❌ Failed to create meeting")
      }
    } catch (error) {
      console.error("Error creating meeting:", error)
      setMessage("❌ Error creating meeting")
    } finally {
      setIsLoading(false)
    }
  }

  const deleteMeeting = async (meetingId: string) => {
    if (!accessToken) return

    try {
      const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${meetingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      })

      if (response.ok) {
        setMessage("✅ Meeting deleted successfully!")
        await fetchMeetings(accessToken)
      } else {
        setMessage("❌ Failed to delete meeting")
      }
    } catch (error) {
      console.error("Error deleting meeting:", error)
      setMessage("❌ Error deleting meeting")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: string) => {
    if (!bytes) return 'Unknown size'
    const size = parseInt(bytes)
    if (isNaN(size)) return 'Unknown size'
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
    return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  }

  const refreshRecordings = async () => {
    if (accessToken) {
      setIsLoading(true)
      await fetchRecordings(accessToken)
      setIsLoading(false)
    }
  }

  return (
    <div className='text-white min-h-screen bg-gray-900 p-4'>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Google Meet Manager</h1>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-lg">
            {['check', 'meetings', 'create', 'recordings'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-md capitalize transition-colors ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-700'
                }`}
              >
                {tab === 'check' ? 'Access Check' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* User Info */}
        {currentUser && (
          <div className="mb-6 p-4 bg-gray-800 rounded-lg text-center">
            <h2 className="text-lg font-semibold mb-2">
              Welcome, {currentUser.username || currentUser.full_name || "User"}!
            </h2>
            <p className="text-sm text-gray-300">User ID: {currentUser.id}</p>
          </div>
        )}

        {/* Access Check Tab */}
        {activeTab === 'check' && (
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md mx-auto text-center">
            <h2 className="text-2xl font-bold mb-6">Google Meet Access Checker</h2>
            
            <Button 
              onClick={checkGoogleMeetAccess}
              disabled={isLoading || !currentUser}
              className="mb-6 w-full"
            >
              {isLoading ? "Checking..." : "Check Meet Access"}
            </Button>

            <div className="p-4 bg-gray-700 rounded">
              <h3 className="text-blue-400 font-medium mb-2">Status:</h3>
              <p className="text-sm">{message}</p>
            </div>

            {/* OAuth Scope Requirements */}
            <div className="mt-6 p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
              <h4 className="text-blue-400 font-medium mb-2 flex items-center">
                <AlertCircle className="mr-2" size={16} />
                Required OAuth Scopes:
              </h4>
              <ul className="text-xs text-gray-300 space-y-1 text-left">
                <li>• https://www.googleapis.com/auth/calendar</li>
                <li>• https://www.googleapis.com/auth/drive.readonly</li>
                <li>• https://www.googleapis.com/auth/drive.metadata.readonly</li>
              </ul>
            </div>
          </div>
        )}

        {/* Meetings Tab */}
        {activeTab === 'meetings' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Calendar className="mr-2" />
              Scheduled Meetings ({meetings.length})
            </h2>
            
            {meetings.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No upcoming meetings found</p>
            ) : (
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-semibold">{meeting.summary}</h3>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingMeeting(meeting)}
                          className="p-2 text-blue-400 hover:bg-gray-600 rounded"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => deleteMeeting(meeting.id)}
                          className="p-2 text-red-400 hover:bg-gray-600 rounded"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {meeting.description && (
                      <p className="text-gray-300 mb-2">{meeting.description}</p>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-400 mb-2">
                      <Clock className="mr-1" size={14} />
                      <span>{formatDate(meeting.start.dateTime)} - {formatDate(meeting.end.dateTime)}</span>
                    </div>
                    
                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <div className="flex items-center text-sm text-gray-400 mb-2">
                        <Users className="mr-1" size={14} />
                        <span>{meeting.attendees.length} attendees</span>
                      </div>
                    )}
                    
                    {meeting.conferenceData?.entryPoints?.[0]?.uri && (
                      <div className="flex items-center justify-between mt-3">
                        <a
                          href={meeting.conferenceData.entryPoints[0].uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-400 hover:text-blue-300"
                        >
                          <Video className="mr-1" size={14} />
                          Join Meeting
                        </a>
                        <span className={`px-2 py-1 rounded text-xs ${
                          meeting.status === 'confirmed' ? 'bg-green-600' : 'bg-yellow-600'
                        }`}>
                          {meeting.status}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Create Meeting Tab */}
        {activeTab === 'create' && (
          <div className="bg-gray-800 p-6 rounded-lg max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Plus className="mr-2" />
              Create New Meeting
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Meeting Title *</label>
                <input
                  type="text"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({...newMeeting, title: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="Enter meeting title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({...newMeeting, description: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Enter meeting description"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newMeeting.startDate}
                    onChange={(e) => setNewMeeting({...newMeeting, startDate: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={newMeeting.startTime}
                    onChange={(e) => setNewMeeting({...newMeeting, startTime: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">End Date *</label>
                  <input
                    type="date"
                    value={newMeeting.endDate}
                    onChange={(e) => setNewMeeting({...newMeeting, endDate: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">End Time *</label>
                  <input
                    type="time"
                    value={newMeeting.endTime}
                    onChange={(e) => setNewMeeting({...newMeeting, endTime: e.target.value})}
                    className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Attendees (Email addresses, comma-separated)</label>
                <input
                  type="text"
                  value={newMeeting.attendees}
                  onChange={(e) => setNewMeeting({...newMeeting, attendees: e.target.value})}
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
              
              <Button
                onClick={createMeeting}
                disabled={isLoading || !newMeeting.title || !newMeeting.startDate || !newMeeting.startTime || !newMeeting.endDate || !newMeeting.endTime}
                className="w-full"
              >
                {isLoading ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </div>
        )}

        {/* Recordings Tab */}
        {activeTab === 'recordings' && (
          <div className="bg-gray-800 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Video className="mr-2" />
                Meeting Recordings ({recordings.length})
              </h2>
              <Button
                onClick={refreshRecordings}
                disabled={isLoading || !accessToken}
                variant="outline"
                size="sm"
              >
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
            
            {recordingsError && (
              <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
                <div className="flex items-center text-red-400 mb-2">
                  <AlertCircle className="mr-2" size={16} />
                  <span className="font-medium">Recording Access Issue:</span>
                </div>
                <p className="text-sm text-red-300">{recordingsError}</p>
              </div>
            )}
            
            {recordings.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                {recordingsError ? "Unable to access recordings" : "No meeting recordings found"}
              </p>
            ) : (
              <div className="space-y-4">
                {recordings.map((recording) => (
                  <div key={recording.id} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">{recording.name}</h3>
                        <div className="text-xs text-gray-400 mb-2">
                          <span className="bg-gray-600 px-2 py-1 rounded">
                            {recording.mimeType}
                          </span>
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <a
                          href={recording.webViewLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-blue-400 hover:bg-gray-600 rounded"
                          title="View Recording"
                        >
                          <Play size={16} />
                        </a>
                        <a
                          href={`https://drive.google.com/uc?export=download&id=${recording.id}`}
                          className="p-2 text-green-400 hover:bg-gray-600 rounded"
                          title="Download Recording"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download size={16} />
                        </a>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>Created: {formatDate(recording.createdTime)}</span>
                      <span>Size: {formatFileSize(recording.size)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Status Message */}
        {message && message !== "Wait for the results" && (
          <div className="mt-6 p-4 bg-gray-700 rounded-lg text-center">
            <p className="text-sm">{message}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Page