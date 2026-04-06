package com.student.erp

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Bitmap
import android.net.http.SslError
import android.os.Bundle
import android.view.View
import android.webkit.SslErrorHandler
import android.webkit.WebResourceError
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.ProgressBar
import android.widget.Toast
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONObject

class WebPortalActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var pageLoading: ProgressBar
    private lateinit var sessionManager: SessionManager

    private var didInjectSession = false
    private var didReloadAfterInject = false

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_web_portal)

        sessionManager = SessionManager(this)

        val token = intent.getStringExtra(EXTRA_TOKEN).orEmpty().ifBlank {
            sessionManager.getToken().orEmpty()
        }
        val studentJson = intent.getStringExtra(EXTRA_STUDENT_JSON).orEmpty().ifBlank {
            sessionManager.getStudentJson().orEmpty()
        }

        if (token.isBlank() || studentJson.isBlank()) {
            redirectToLogin()
            return
        }

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

        webView.webViewClient = object : WebViewClient() {
            override fun onPageStarted(view: WebView?, url: String?, favicon: Bitmap?) {
                super.onPageStarted(view, url, favicon)
                pageLoading.visibility = View.VISIBLE
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)

                val currentUrl = url.orEmpty()
                if (!didInjectSession) {
                    val tokenJs = JSONObject.quote(token)
                    val studentJs = JSONObject.quote(studentJson)
                    val script = """
                        (function() {
                            localStorage.setItem('studentToken', $tokenJs);
                            localStorage.setItem('studentInfo', $studentJs);
                        })();
                    """.trimIndent()

                    webView.evaluateJavascript(script, null)
                    didInjectSession = true
                }

                if (!didReloadAfterInject) {
                    didReloadAfterInject = true
                    webView.loadUrl(BASE_URL)
                    return
                }

                if (currentUrl.contains("/student/login")) {
                    webView.loadUrl(BASE_URL)
                    return
                }

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

        webView.loadUrl(BASE_URL)
    }

    private fun redirectToLogin() {
        sessionManager.clear()
        startActivity(Intent(this, LoginActivity::class.java))
        finish()
    }

    companion object {
        const val EXTRA_TOKEN = "extra_token"
        const val EXTRA_STUDENT_JSON = "extra_student_json"
        private const val BASE_URL = "https://defacto-student-erp-new.vercel.app/"
    }
}
