package com.student.erp

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.Uri
import android.net.http.SslError
import android.os.Bundle
import android.view.View
import android.webkit.SslErrorHandler
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class WebPortalActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var pageLoading: ProgressBar
    private lateinit var sessionManager: SessionManager

    /** Tracks whether the very first injection + reload cycle has completed. */
    private var initialInjectionDone = false

    // ── File chooser support for <input type="file"> inside the WebView ──────
    private var fileChooserCallback: ValueCallback<Array<Uri>>? = null

    private val fileChooserLauncher = registerForActivityResult(
        ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        // Deliver result back to WebView; send null on cancellation
        fileChooserCallback?.onReceiveValue(
            if (uris.isEmpty()) null else uris.toTypedArray()
        )
        fileChooserCallback = null
    }
    // ─────────────────────────────────────────────────────────────────────────

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_web_portal)

        sessionManager = SessionManager(this)

        // Prefer intent extras; fall back to SharedPreferences.
        val token = intent.getStringExtra(EXTRA_TOKEN).orEmpty().ifBlank {
            sessionManager.getToken().orEmpty()
        }
        val refreshToken = intent.getStringExtra(EXTRA_REFRESH_TOKEN).orEmpty().ifBlank {
            sessionManager.getRefreshToken().orEmpty()
        }
        val studentJson = intent.getStringExtra(EXTRA_STUDENT_JSON).orEmpty().ifBlank {
            sessionManager.getStudentJson().orEmpty()
        }
        val accessTokenExpiresAt = intent.getStringExtra(EXTRA_ACCESS_TOKEN_EXPIRES_AT).orEmpty().ifBlank {
            sessionManager.getAccessTokenExpiresAt().orEmpty()
        }

        val isSignup = intent.getBooleanExtra(EXTRA_IS_SIGNUP, false)

        // If we have absolutely no credentials, the user hasn't logged in (unless they are signing up).
        if (!isSignup && ((token.isBlank() && refreshToken.isBlank()) || studentJson.isBlank())) {
            redirectToLogin()
            return
        }

        if (token.isNotBlank()) {
            PushTokenSyncer.syncCurrentToken(this, token)
        }

        // Persist the freshest values into SharedPreferences so they survive WebView evictions.
        sessionManager.saveSession(token, refreshToken, studentJson, accessTokenExpiresAt)

        webView = findViewById(R.id.webView)
        pageLoading = findViewById(R.id.pageLoading)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (::webView.isInitialized && webView.canGoBack()) {
                    webView.goBack()
                } else {
                    isEnabled = false
                    onBackPressedDispatcher.onBackPressed()
                }
            }
        })

        // ── File chooser: intercept <input type="file"> taps in the WebView ──
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                wv: WebView?,
                callback: ValueCallback<Array<Uri>>,
                params: FileChooserParams
            ): Boolean {
                // Cancel any previous pending callback before starting a new one
                fileChooserCallback?.onReceiveValue(null)
                fileChooserCallback = callback

                // Use the MIME types from the web page (e.g. "image/*") or default to all
                val mimeTypes = params.acceptTypes
                    ?.filter { it.isNotBlank() }
                    ?.joinToString(",")
                    ?.takeIf { it.isNotBlank() }
                    ?: "image/*"

                fileChooserLauncher.launch(mimeTypes)
                return true
            }
        }
        // ─────────────────────────────────────────────────────────────────────

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                pageLoading.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                val currentUrl = url.orEmpty()

                if (!initialInjectionDone) {
                    // First load: inject session and reload so the web app picks it up.
                    injectSessionIntoWebView {
                        initialInjectionDone = true
                        val isSignup = intent.getBooleanExtra(EXTRA_IS_SIGNUP, false)
                        val targetUrl = if (isSignup) {
                            Config.FRONTEND_URL.removeSuffix("/") + "/student/signup"
                        } else {
                            Config.FRONTEND_URL
                        }
                        webView.loadUrl(targetUrl)
                    }
                    return
                }

                // On every subsequent page load, re-inject session from SharedPreferences
                // into localStorage. This covers cases where the WebView cleared its data
                // (memory pressure, OS-level cache wipe, etc.).
                reinjectSessionIfNeeded()

                // If the web app redirected to the login page, check if it was a deliberate logout
                if (currentUrl.contains("/student/login")) {
                    webView.evaluateJavascript("localStorage.getItem('studentLogoutTriggered')") { result ->
                        val isLogout = result?.replace("\"", "") == "true"
                        if (isLogout) {
                            // Explicit logout triggered by the web app
                            sessionManager.clear()
                            webView.evaluateJavascript("localStorage.removeItem('studentLogoutTriggered');", null)
                            redirectToLogin()
                        } else {
                            // Might be a web-side token refresh failure or random navigation.
                            // Check if we still have credentials in SharedPreferences.
                            val spRefresh = sessionManager.getRefreshToken()
                            val spStudent = sessionManager.getStudentJson()
                            if (!spRefresh.isNullOrBlank() && !spStudent.isNullOrBlank()) {
                                injectSessionIntoWebView {
                                    webView.loadUrl(Config.FRONTEND_URL)
                                }
                            } else {
                                redirectToLogin()
                            }
                        }
                    }
                    return
                }

                // Sync any updated tokens the web app may have written back to localStorage
                // (e.g. after a refresh-token rotation) into SharedPreferences.
                syncSessionFromWebStorage()

                pageLoading.visibility = View.GONE
            }

            override fun onReceivedHttpError(
                view: WebView?,
                request: WebResourceRequest?,
                errorResponse: WebResourceResponse?
            ) {
                super.onReceivedHttpError(view, request, errorResponse)
                if (request?.isForMainFrame == true && errorResponse?.statusCode == 404) {
                    Toast.makeText(this@WebPortalActivity, "Link not found", Toast.LENGTH_LONG).show()
                }
            }

            override fun onReceivedError(
                view: WebView?,
                request: WebResourceRequest?,
                error: WebResourceError?
            ) {
                super.onReceivedError(view, request, error)
                if (request?.isForMainFrame == true) {
                    pageLoading.visibility = View.GONE
                    val message = when (error?.errorCode) {
                        ERROR_HOST_LOOKUP,
                        ERROR_CONNECT,
                        ERROR_TIMEOUT -> "Link not found"
                        else -> "Unable to connect. Check your internet connection."
                    }
                    Toast.makeText(this@WebPortalActivity, message, Toast.LENGTH_LONG).show()
                }
            }

            override fun onReceivedSslError(view: WebView?, handler: SslErrorHandler?, error: SslError?) {
                super.onReceivedSslError(view, handler, error)
                handler?.cancel()
                Toast.makeText(this@WebPortalActivity, "Secure connection failed", Toast.LENGTH_LONG).show()
            }
        }

        webView.loadUrl(Config.FRONTEND_URL)
    }

    /**
     * Injects the full session (token, refreshToken, studentInfo, expiry) from
     * SharedPreferences into the WebView's localStorage, then invokes [onDone].
     */
    private fun injectSessionIntoWebView(onDone: (() -> Unit)? = null) {
        val tokenJs = JSONObject.quote(sessionManager.getToken().orEmpty())
        val refreshTokenJs = JSONObject.quote(sessionManager.getRefreshToken().orEmpty())
        val studentJs = JSONObject.quote(sessionManager.getStudentJson().orEmpty())
        val expiryJs = JSONObject.quote(sessionManager.getAccessTokenExpiresAt().orEmpty())

        val script = """
            (function() {
                if ($tokenJs && $tokenJs !== "") {
                    localStorage.setItem('studentToken', $tokenJs);
                } else {
                    localStorage.removeItem('studentToken');
                }

                if ($refreshTokenJs && $refreshTokenJs !== "") {
                    localStorage.setItem('studentRefreshToken', $refreshTokenJs);
                } else {
                    localStorage.removeItem('studentRefreshToken');
                }

                if ($studentJs && $studentJs !== "") {
                    localStorage.setItem('studentInfo', $studentJs);
                }

                if ($expiryJs && $expiryJs !== "") {
                    localStorage.setItem('studentAccessTokenExpiresAt', $expiryJs);
                } else {
                    localStorage.removeItem('studentAccessTokenExpiresAt');
                }
            })();
        """.trimIndent()

        webView.evaluateJavascript(script) {
            onDone?.invoke()
        }
    }

    /**
     * Checks if the WebView's localStorage has lost its refresh token (e.g. due to
     * cache eviction). If so, re-injects the session from SharedPreferences.
     * This is the key mechanism that keeps users logged in across WebView restarts.
     */
    private fun reinjectSessionIfNeeded() {
        val checkScript = """
            (function() {
                var rt = localStorage.getItem('studentRefreshToken');
                var si = localStorage.getItem('studentInfo');
                return (rt && rt !== '' && si && si !== '') ? 'ok' : 'missing';
            })();
        """.trimIndent()

        webView.evaluateJavascript(checkScript) { result ->
            val value = result?.replace("\"", "") ?: ""
            if (value == "missing") {
                val spRefresh = sessionManager.getRefreshToken()
                val spStudent = sessionManager.getStudentJson()
                if (!spRefresh.isNullOrBlank() && !spStudent.isNullOrBlank()) {
                    injectSessionIntoWebView()
                }
            }
        }
    }

    /**
     * Reads the current session values from the WebView's localStorage and
     * persists them into SharedPreferences. This captures token rotations
     * performed by the web app's axios interceptor.
     *
     * IMPORTANT: If localStorage is empty, we do NOT clear SharedPreferences.
     * The web frontend may have lost its storage due to eviction, but
     * SharedPreferences still holds the last known-good session.
     */
    private fun syncSessionFromWebStorage() {
        val script = """
            (function() {
                return {
                    token: localStorage.getItem('studentToken'),
                    refreshToken: localStorage.getItem('studentRefreshToken'),
                    studentInfo: localStorage.getItem('studentInfo'),
                    accessTokenExpiresAt: localStorage.getItem('studentAccessTokenExpiresAt')
                };
            })();
        """.trimIndent()

        webView.evaluateJavascript(script) { rawResult ->
            try {
                if (rawResult.isNullOrBlank() || rawResult == "null") {
                    // WebView returned nothing — do NOT clear SharedPreferences.
                    return@evaluateJavascript
                }

                val payload = JSONObject(rawResult)
                val tokenValue = payload.optString("token").takeIf { it.isNotBlank() }
                val refreshTokenValue = payload.optString("refreshToken").takeIf { it.isNotBlank() }
                val studentInfoValue = payload.optString("studentInfo").takeIf { it.isNotBlank() }
                val expiryValue = payload.optString("accessTokenExpiresAt").takeIf { it.isNotBlank() }

                if (tokenValue == null && refreshTokenValue == null && studentInfoValue.isNullOrBlank()) {
                    // localStorage is empty, but this could be a WebView data eviction.
                    // Do NOT call sessionManager.clear() — preserve SharedPreferences.
                    return@evaluateJavascript
                }

                val oldToken = sessionManager.getToken()

                // Only persist if we actually have meaningful data from localStorage.
                sessionManager.saveSession(
                    token = tokenValue,
                    refreshToken = refreshTokenValue,
                    studentJson = studentInfoValue,
                    accessTokenExpiresAt = expiryValue
                )

                // If the token changed (e.g., fresh login or signup in WebView), sync push token natively
                if (tokenValue != null && tokenValue != oldToken) {
                    PushTokenSyncer.syncCurrentToken(this@WebPortalActivity, tokenValue)
                }
            } catch (_: Exception) {
                // Ignore serialization issues; the next navigation can sync again.
            }
        }
    }

    private fun redirectToLogin() {
        sessionManager.clear()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    object Config {
        const val API_BASE_URL = "https://defacto-student-portal.vercel.app/"
        const val FRONTEND_URL = "https://student.defactoinstitute.in/"

        fun getApiUrl(endpoint: String): String {
            val base = API_BASE_URL.removeSuffix("/")
            val cleanEndpoint = endpoint.removePrefix("/")
            return "$base/$cleanEndpoint"
        }
    }

    companion object {
        const val EXTRA_TOKEN = "extra_token"
        const val EXTRA_REFRESH_TOKEN = "extra_refresh_token"
        const val EXTRA_STUDENT_JSON = "extra_student_json"
        const val EXTRA_ACCESS_TOKEN_EXPIRES_AT = "extra_access_token_expires_at"
        const val EXTRA_IS_SIGNUP = "extra_is_signup"
    }
}
