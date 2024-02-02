import { useEffect, useState } from "react"
import "./App.css"
import axios from "axios"

interface Message {
  content: string
  timestamp: number
  fromUserId: number
  toUserId: number
}

interface MostRecent {
  content: string
  timestamp: number
  userId: number
}

interface Conversation {
  avatar: string
  firstName: string
  lastName: string
  mostRecentMessage: MostRecent
  totalMessages: number
  userId: number
}

interface User {
  id: number
  firstName: string
  lastName: string
  avatar: string
}

function App() {
  const [data, setData] = useState()
  const users = new Map<number, User>()
  const [userId, setUserId] = useState(0)

  const getData = async () => {
    axios
      .get(
        "https://candidate.hubteam.com/candidateTest/v3/problem/dataset?userKey=ddec8640166f6975820ad57a1942"
      )
      .then((resp: any) => {
        setData(resp.data)
        setUserId(resp.data.userId)
        parseData()
      })
  }

  const parseUsers = (usersArr: User[]) => {
    usersArr.forEach((element: User) => {
      users.set(element.id, {
        id: element.id,
        firstName: element.firstName,
        lastName: element.lastName,
        avatar: element.avatar,
      })
    })
  }

  const parseConversations = (
    messageArr: Message[]
  ): Map<number, Conversation> => {
    let conversations = new Map<number, Conversation>()

    messageArr.forEach((element) => {
      let convoId =
        element.toUserId === userId ? element.fromUserId : element.toUserId

      // does a conversation entry exist already
      if (!conversations.has(convoId)) {
        let convoObject: Conversation = {
          avatar: users.get(convoId)?.avatar || "",
          firstName: users.get(convoId)?.firstName || "",
          lastName: users.get(convoId)?.lastName || "",
          mostRecentMessage: {
            content: element.content,
            timestamp: element.timestamp,
            userId: element.fromUserId,
          },
          totalMessages: 1,
          userId: convoId,
        }
        conversations.set(convoId, convoObject)
      } else {
        // conversation exists, so figure out if its the most recent and increment total messages
        if (
          conversations.get(convoId)!.mostRecentMessage.timestamp <
          element.timestamp
        ) {
          let numMessages = conversations.get(convoId)!.totalMessages
          numMessages = numMessages + 1
          let convoObject: Conversation = {
            avatar: users.get(convoId)?.avatar || "",
            firstName: users.get(convoId)?.firstName || "",
            lastName: users.get(convoId)?.lastName || "",
            mostRecentMessage: {
              content: element.content,
              timestamp: element.timestamp,
              userId: element.fromUserId,
            },
            totalMessages: numMessages,
            userId: convoId,
          }
          conversations.set(convoId, convoObject)
        } else {
          let numMessages = conversations.get(convoId)!.totalMessages
          numMessages = numMessages + 1
          conversations.get(convoId)!.totalMessages = numMessages
        }
      }
    })

    return conversations
  }

  const sortConversations = (a: Conversation, b: Conversation) => {
    return b.mostRecentMessage.timestamp - a.mostRecentMessage.timestamp
  }

  const parseData = () => {
    if (data) {
      parseUsers(data["users"])
      let unsortedConversations = parseConversations(data["messages"])
      let sortedConversations = [...unsortedConversations.values()].sort(
        sortConversations
      )

      axios.post(
        "https://candidate.hubteam.com/candidateTest/v3/problem/result?userKey=ddec8640166f6975820ad57a1942",
        {
          conversations: sortedConversations,
        }
      )
    }
  }

  useEffect(() => {
    getData()
  }, [])

  return <pre></pre>
}

export default App
