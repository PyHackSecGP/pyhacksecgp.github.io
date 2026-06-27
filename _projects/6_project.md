---
layout: page
title: "75 Hard Tracker"
description: "Flask web app for tracking 75 Hard challenge — daily check-ins, weight log, streak counter"
img: assets/img/proj_75hard.jpg
importance: 6
category: personal tools
---

<div class="row">
  <div class="col-sm-12">
    <a href="https://github.com/PyHackSecGP/75hard-tracker" class="btn btn-sm btn-outline-primary mb-3">
      <i class="fab fa-github"></i> View on GitHub
    </a>
  </div>
</div>

## Overview

A personal web app to track the 75 Hard mental toughness program — two workouts, diet, water intake, reading, and progress photos every day for 75 days. Built because spreadsheets aren't motivating.

## Features

- Daily check-in form with all 5 tasks
- Weight and body measurement logging
- Streak counter with Day 0 restart on miss
- Progress chart (Chart.js)
- Running on homelab Kali VM at port 5757

## Stack

`Flask` · `SQLite` · `Bootstrap 5` · `Chart.js` · `Tailscale` (remote access)

## Discipline Rule

Miss one task = Day 0 restart. No exceptions. The code enforces it.
