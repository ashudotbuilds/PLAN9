# -*- coding: utf-8 -*-
"""probes package

Provides reusable probe objects for DriftGuard.
Exports:
    Probe – abstract base class
    DomainProbe – concrete implementation for HTTP‑based domain probing
"""

from .domain_probe import Probe, DomainProbe

__all__ = ["Probe", "DomainProbe"]
