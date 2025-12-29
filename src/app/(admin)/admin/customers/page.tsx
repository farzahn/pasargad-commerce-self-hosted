'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Search, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/shared/loading-spinner'
import { EmptyState } from '@/components/shared/empty-state'
import { formatDate } from '@/lib/utils'
import { getPocketBaseClient, buildFileUrl } from '@/lib/pocketbase'
import type { User } from '@/types/pocketbase'

export default function AdminCustomersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function fetchUsers() {
      try {
        const pb = getPocketBaseClient()
        const result = await pb.collection('users').getList<User>(1, 500, {
          sort: '-id',
        })
        setUsers(result.items)
      } catch (error) {
        console.error('Error fetching users:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(
    (user) =>
      search === '' ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.name.toLowerCase().includes(search.toLowerCase())
  )

  const getAvatarUrl = (user: User): string | undefined => {
    if (!user.avatar) return undefined
    return buildFileUrl(user.collectionId, user.id, user.avatar, '100x100')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Customers</h1>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      {filteredUsers.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No customers found"
          description={
            search
              ? 'Try adjusting your search'
              : 'Customers will appear here when they sign up'
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <Card key={user.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={getAvatarUrl(user)} alt={user.name} />
                    <AvatarFallback>
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name || 'No name'}</p>
                      {user.isBlocked && (
                        <Badge variant="destructive">Blocked</Badge>
                      )}
                      {user.verified && (
                        <Badge variant="secondary">Verified</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(user.created)}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/admin/customers/${user.id}`}>
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
