# Let Claude Code tell you when something new lands in Dear Karl

Claude doesn't check your inbox unless you ask it to. A Claude Code **hook**
can do the checking for you. A hook is a small script that Claude Code runs on
its own at set moments. This one asks the Dear Karl server which files are in
your `dearkarl` folder. It then passes a short summary to Claude, which tells
you about it.

- **At the start of every session:** you see what's in the folder.
- **When you send a message:** Claude checks again, at most once every 5
  minutes, and mentions only files that are new or changed since the last
  check.

The hook sends Claude names and dates only, never file contents. Claude opens
a file only when you ask it to.

## What you need

- Claude Code (the CLI). Hooks don't run in the claude.ai chat.
- A Dear Karl token (`karl_...`) from `karl.przemekkudla.pl`.
- `curl` and `python3`. Both come with macOS and most Linux systems.

## Setup (about 5 minutes)

**1. Copy the script** [`hooks/karl-inbox-check.sh`](hooks/karl-inbox-check.sh)
to `~/.claude/hooks/` and make it executable:

```bash
mkdir -p ~/.claude/hooks
cp doc/hooks/karl-inbox-check.sh ~/.claude/hooks/
chmod +x ~/.claude/hooks/karl-inbox-check.sh
```

**2. Give the script your token.** Add this line to `~/.zshrc` (or
`~/.bashrc`), then open a new terminal:

```bash
export KARL_TOKEN="karl_<your token>"
```

Keep the token in your shell profile. Don't put it in `settings.json`: people
often back up or share that file, and anyone who has the token can read your
files.

**3. Register the hook.** Merge the following into `~/.claude/settings.json`.
If you already have a `hooks` section, add these entries to it rather than
replacing it:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/karl-inbox-check.sh" }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          { "type": "command", "command": "bash ~/.claude/hooks/karl-inbox-check.sh prompt" }
        ]
      }
    ]
  }
}
```

Or skip the editing: in Claude Code, type *"add a SessionStart and a
UserPromptSubmit hook that run ~/.claude/hooks/karl-inbox-check.sh (with
`prompt` as the argument for UserPromptSubmit)"* and Claude will make the
change for you.

**4. Check that it works.** Start a new `claude` session. If your folder has
files, Claude opens with a line like this:

```
Dear Karl: 2 file(s) in the folder. ...
```

To read one, just ask: *"read the newest file from Dear Karl"*. Claude uses the
`dearkarl` MCP server for this (see [dearkarl-skill.md](dearkarl-skill.md)).

## Good to know

- **No token, or offline?** The hook stays silent and never blocks your
  session.
- **How often it checks:** on each message you send, at most once every
  5 minutes (the `300` in the script). To check only at session start, leave
  out the `UserPromptSubmit` entry.
- **File names are untrusted.** Anyone who can put a file in your folder
  chooses its name. The hook labels names as data, so Claude won't follow
  instructions written in a file name.
- **To turn it off,** remove the two entries from `~/.claude/settings.json`.
