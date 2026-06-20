"""Shared Jugaad protocol for coordinator ↔ specialist messaging."""

from uagents import Protocol

from .models import JugaadQuery, JugaadResponse

jugaad_protocol = Protocol(name="jugaad", version="1.0.0")
