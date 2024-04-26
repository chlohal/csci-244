from django.http import HttpResponse
import qrcode

def render_qr_code(request):
    resp = HttpResponse(content_type="image/png")
    qrcode.make(request.GET.get("data")).save(resp, "PNG")
    return resp
