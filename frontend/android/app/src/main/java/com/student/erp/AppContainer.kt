package com.student.erp

import android.content.Context

object AppContainer {
    @Volatile
    private var authRepository: AuthRepository? = null

    fun authRepository(context: Context): AuthRepository {
        return authRepository ?: synchronized(this) {
            authRepository ?: AuthRepository(
                context = context.applicationContext,
                api = AuthApi(),
                secureTokenStore = SecureTokenStore(context.applicationContext)
            ).also { authRepository = it }
        }
    }
}
