import { useEffect, useRef } from 'react'

import { useAppDispatch, useAppSelector } from '../../app/hooks'

import { useLazyGetMeQuery } from './authApi'
import { setCredentials } from './authSlice'
import { updatePersistedUser } from './authStorage'

/** Refreshes auth user from `/auth/me` so `mustChangePassword` matches the server after reload. */
export function AuthBootstrap() {
  const dispatch = useAppDispatch()
  const token = useAppSelector((s) => s.auth.token)
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated)
  const [getMe] = useLazyGetMeQuery()
  const attempted = useRef(false)

  useEffect(() => {
    if (!isAuthenticated || !token || attempted.current) {
      return
    }
    attempted.current = true
    void getMe()
      .unwrap()
      .then((res) => {
        if (res.success && res.data) {
          dispatch(setCredentials({ token, user: res.data }))
          updatePersistedUser(res.data)
        }
      })
      .catch(() => {})
  }, [dispatch, getMe, isAuthenticated, token])

  return null
}
