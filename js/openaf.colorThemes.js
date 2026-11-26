// Copyright 2026 Nuno Aguiar
// Built-in color themes for __colorFormat (see setColorFormat and getColorFormatThemes)
// Each theme md.bg is only applied when requested (withMdBg or __flags.COLOR_THEME_MDBG)

var __colorFormatThemes = {
  "basic": {
    "key": "INTENSITY_BOLD",
    "number": "GREEN",
    "string": "CYAN",
    "boolean": "RED",
    "date": "MAGENTA",
    "default": "YELLOW",
    "table": {
      "lines": "RESET",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BOLD"
    },
    "tree": {
      "lines": "",
      "curved": false
    },
    "md": {
      "bg": "BG(237),FG(231)"
    }
  },
  "default": {
    "key": "INTENSITY_BOLD",
    "number": "GREEN",
    "string": "CYAN",
    "boolean": "RED",
    "date": "MAGENTA",
    "default": "YELLOW",
    "table": {
      "lines": "RESET",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BOLD"
    },
    "tree": {
      "lines": "",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "YELLOW,BOLD",
        "text": "NEGATIVE_ON,ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FAINT",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "mono": {
    "key": "INTENSITY_BOLD",
    "number": "FG(240)",
    "string": "FG(245)",
    "boolean": "FG(15)",
    "date": "FG(245)",
    "default": "FG(0)",
    "table": {
      "lines": "RESET",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "FAINT"
    },
    "tree": {
      "lines": "RESET",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "BOLD",
        "text": "FAINT,ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FAINT",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "mono2": {
    "key": "INTENSITY_BOLD",
    "number": "ITALIC,FG(244)",
    "string": "FG(7)",
    "boolean": "ITALIC,FG(7)",
    "date": "FG(245)",
    "default": "FG(240)",
    "table": {
      "lines": "RESET",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BG(236)"
    },
    "tree": {
      "lines": "FG(250)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "BOLD",
        "text": "BG(236),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FAINT",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "redmono": {
    "key": "INTENSITY_BOLD",
    "number": "ITALIC,FG(240)",
    "string": "FG(245)",
    "boolean": "ITALIC,FG(7)",
    "date": "FG(245)",
    "default": "FG(240)",
    "table": {
      "lines": "RESET,FG(124)",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BG(236)"
    },
    "tree": {
      "lines": "FG(124)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "RED",
        "text": "BG(236),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FAINT,RED",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "RED,FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "blue": {
    "key": "INTENSITY_BOLD,FG(4)",
    "number": "FG(12)",
    "string": "FG(4)",
    "boolean": "FG(27)",
    "date": "FG(39)",
    "default": "FG(16)",
    "table": {
      "lines": "RESET,FG(12)",
      "value": "RESET",
      "title": "BOLD,FG(4)",
      "bandRow": "BOLD"
    },
    "tree": {
      "lines": "FG(12)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "INTENSITY_BOLD,FG(4)",
        "text": "FG(4),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FAINT",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(12)",
        "theme": "simpleLine"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "jeans": {
    "key": "INTENSITY_BOLD,FG(255)",
    "number": "ITALIC,FG(69)",
    "string": "FG(33)",
    "boolean": "ITALIC,FG(27)",
    "date": "FG(39)",
    "default": "ITALIC,FG(20)",
    "table": {
      "lines": "RESET,RED",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "FG(15),BG(26)"
    },
    "tree": {
      "lines": "RED",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "RED",
        "text": "FG(15),BG(26),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "RED",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(17),FG(255)"
    }
  },
  "thin": {
    "key": "",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "text": "BG(236),ITALIC"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "thin-intense": {
    "key": "RESET",
    "number": "FG(41)",
    "string": "FG(81)",
    "boolean": "FG(249)",
    "date": "FG(80)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "RESET",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "text": "BG(236),ITALIC"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "thin-intense-bold": {
    "key": "BOLD",
    "number": "FG(41)",
    "string": "FG(81)",
    "boolean": "FG(249)",
    "date": "FG(80)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "text": "BG(236),ITALIC"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "thin-light": {
    "key": "",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "",
      "bandRow": "BG(254)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "YELLOW",
        "text": "BG(230),ITALIC"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "thin-italic": {
    "key": "ITALIC",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "ITALIC",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "text": "BG(236),ITALIC"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "thin-light-italic": {
    "key": "ITALIC",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "ITALIC",
      "bandRow": "BG(254)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "YELLOW",
        "text": "BG(230),ITALIC"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "thin-bold": {
    "key": "BOLD",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "text": "BG(236),ITALIC"
      },
      "bg": "BG(232),FG(252)"
    }
  },
  "thin-light-bold": {
    "key": "BOLD",
    "number": "FG(29)",
    "string": "FG(67)",
    "boolean": "FG(249)",
    "date": "FG(31)",
    "default": "FG(244)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "BOLD",
      "bandRow": "BG(254)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "YELLOW",
        "text": "BG(230),ITALIC"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "yellow": {
    "key": "INTENSITY_BOLD,FG(229)",
    "number": "FG(3)",
    "string": "YELLOW",
    "boolean": "FG(216)",
    "date": "FG(11)",
    "default": "FG(226)",
    "table": {
      "lines": "RESET,FG(11)",
      "value": "RESET",
      "title": "BOLD,FG(229)",
      "bandRow": "BOLD"
    },
    "tree": {
      "lines": "FG(11)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(11),BOLD",
        "text": "FG(229),BG(58),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "BOLD,UNDERLINE",
        "h3": "BOLD",
        "h4": "UNDERLINE"
      },
      "line": "FG(11),FAINT",
      "link": {
        "text": "UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(11),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "dark-slate": {
    "key": "BOLD,FG(153)",
    "number": "FG(117)",
    "string": "FG(151)",
    "boolean": "FG(216)",
    "date": "FG(110)",
    "default": "FG(250)",
    "table": {
      "lines": "RESET,FG(67)",
      "value": "RESET",
      "title": "BOLD,FG(189)",
      "bandRow": "BG(236)"
    },
    "tree": {
      "lines": "FG(67)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(110),BOLD",
        "text": "FG(252),BG(235),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(189),BOLD,UNDERLINE",
        "h3": "FG(153),BOLD",
        "h4": "FG(110),UNDERLINE"
      },
      "line": "FG(67),FAINT",
      "link": {
        "text": "FG(117),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(151),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(110),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(236),FG(231)"
    }
  },
  "dark-amber": {
    "key": "BOLD,FG(223)",
    "number": "FG(215)",
    "string": "FG(186)",
    "boolean": "FG(208)",
    "date": "FG(180)",
    "default": "FG(250)",
    "table": {
      "lines": "RESET,FG(179)",
      "value": "RESET",
      "title": "BOLD,FG(223)",
      "bandRow": "BG(234)"
    },
    "tree": {
      "lines": "FG(179)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(214),BOLD",
        "text": "FG(230),BG(235),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(223),BOLD,UNDERLINE",
        "h3": "FG(215),BOLD",
        "h4": "FG(179),UNDERLINE"
      },
      "line": "FG(179),FAINT",
      "link": {
        "text": "FG(214),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(223),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(180),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "solarized-dark": {
    "key": "BOLD,FG(223)",
    "number": "FG(136)",
    "string": "FG(37)",
    "boolean": "FG(166)",
    "date": "FG(109)",
    "default": "FG(252)",
    "table": {
      "lines": "RESET,FG(240)",
      "value": "RESET",
      "title": "BOLD,FG(109)",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(240)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(109),BOLD",
        "text": "FG(252),BG(236),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(109),BOLD,UNDERLINE",
        "h3": "FG(37),BOLD",
        "h4": "FG(136),UNDERLINE"
      },
      "line": "FG(240),FAINT",
      "link": {
        "text": "FG(37),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(136),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(109),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(234),FG(254)"
    }
  },
  "matrix": {
    "key": "BOLD,FG(118)",
    "number": "FG(82)",
    "string": "FG(120)",
    "boolean": "FG(154)",
    "date": "FG(84)",
    "default": "FG(250)",
    "table": {
      "lines": "RESET,FG(28)",
      "value": "RESET",
      "title": "BOLD,FG(118)",
      "bandRow": "BG(233)"
    },
    "tree": {
      "lines": "FG(28)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(118),BOLD",
        "text": "FG(120),BG(233),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(118),BOLD,UNDERLINE",
        "h3": "FG(82),BOLD",
        "h4": "FG(84),UNDERLINE"
      },
      "line": "FG(28),FAINT",
      "link": {
        "text": "FG(82),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(118),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(84),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "night-owl": {
    "key": "BOLD,FG(117)",
    "number": "FG(81)",
    "string": "FG(222)",
    "boolean": "FG(198)",
    "date": "FG(110)",
    "default": "FG(252)",
    "table": {
      "lines": "RESET,FG(60)",
      "value": "RESET",
      "title": "BOLD,FG(117)",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(60)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(117),BOLD",
        "text": "FG(252),BG(234),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(117),BOLD,UNDERLINE",
        "h3": "FG(222),BOLD",
        "h4": "FG(110),UNDERLINE"
      },
      "line": "FG(60),FAINT",
      "link": {
        "text": "FG(81),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(198),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(110),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(233),FG(252)"
    }
  },
  "forest": {
    "key": "BOLD,FG(114)",
    "number": "FG(71)",
    "string": "FG(150)",
    "boolean": "FG(179)",
    "date": "FG(108)",
    "default": "FG(249)",
    "table": {
      "lines": "RESET,FG(65)",
      "value": "RESET",
      "title": "BOLD,FG(114)",
      "bandRow": "BG(236)"
    },
    "tree": {
      "lines": "FG(65)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(114),BOLD",
        "text": "FG(252),BG(236),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "WHITE,BOLD,UNDERLINE",
        "h2": "FG(114),BOLD,UNDERLINE",
        "h3": "FG(150),BOLD",
        "h4": "FG(179),UNDERLINE"
      },
      "line": "FG(65),FAINT",
      "link": {
        "text": "FG(71),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(114),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(108),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(235),FG(255)"
    }
  },
  "light-paper": {
    "key": "BOLD,FG(24)",
    "number": "FG(25)",
    "string": "FG(58)",
    "boolean": "FG(88)",
    "date": "FG(31)",
    "default": "FG(238)",
    "table": {
      "lines": "RESET,FG(245)",
      "value": "RESET",
      "title": "BOLD,FG(24)",
      "bandRow": "BG(255)"
    },
    "tree": {
      "lines": "FG(245)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(31),BOLD",
        "text": "FG(238),BG(230),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(17),BOLD,UNDERLINE",
        "h2": "FG(24),BOLD,UNDERLINE",
        "h3": "FG(31),BOLD",
        "h4": "FG(58),UNDERLINE"
      },
      "line": "FG(245)",
      "link": {
        "text": "FG(25),UNDERLINE",
        "url": "FG(244),FAINT"
      },
      "bullets": "FG(24),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(31),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "solarized-light": {
    "key": "BOLD,FG(31)",
    "number": "FG(136)",
    "string": "FG(37)",
    "boolean": "FG(166)",
    "date": "FG(61)",
    "default": "FG(241)",
    "table": {
      "lines": "RESET,FG(244)",
      "value": "RESET",
      "title": "BOLD,FG(31)",
      "bandRow": "BG(230)"
    },
    "tree": {
      "lines": "FG(244)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(31),BOLD",
        "text": "FG(241),BG(230),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(24),BOLD,UNDERLINE",
        "h2": "FG(31),BOLD,UNDERLINE",
        "h3": "FG(37),BOLD",
        "h4": "FG(136),UNDERLINE"
      },
      "line": "FG(244)",
      "link": {
        "text": "FG(37),UNDERLINE",
        "url": "FG(244),FAINT"
      },
      "bullets": "FG(136),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(61),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "light-pastel": {
    "key": "BOLD,FG(61)",
    "number": "FG(68)",
    "string": "FG(29)",
    "boolean": "FG(131)",
    "date": "FG(67)",
    "default": "FG(240)",
    "table": {
      "lines": "RESET,FG(246)",
      "value": "RESET",
      "title": "BOLD,FG(61)",
      "bandRow": "BG(254)"
    },
    "tree": {
      "lines": "FG(246)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(68),BOLD",
        "text": "FG(240),BG(225),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(61),BOLD,UNDERLINE",
        "h2": "FG(68),BOLD,UNDERLINE",
        "h3": "FG(29),BOLD",
        "h4": "FG(131),UNDERLINE"
      },
      "line": "FG(246)",
      "link": {
        "text": "FG(68),UNDERLINE",
        "url": "FG(244),FAINT"
      },
      "bullets": "FG(61),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(131),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "ice": {
    "key": "BOLD,FG(25)",
    "number": "FG(31)",
    "string": "FG(24)",
    "boolean": "FG(67)",
    "date": "FG(74)",
    "default": "FG(240)",
    "table": {
      "lines": "RESET,FG(250)",
      "value": "RESET",
      "title": "BOLD,FG(25)",
      "bandRow": "BG(255)"
    },
    "tree": {
      "lines": "FG(250)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(31),BOLD",
        "text": "FG(240),BG(195),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(17),BOLD,UNDERLINE",
        "h2": "FG(25),BOLD,UNDERLINE",
        "h3": "FG(31),BOLD",
        "h4": "FG(67),UNDERLINE"
      },
      "line": "FG(250)",
      "link": {
        "text": "FG(31),UNDERLINE",
        "url": "FG(244),FAINT"
      },
      "bullets": "FG(25),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(74),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(231),FG(16)"
    }
  },
  "terminal-amber": {
    "key": "BOLD,FG(214)",
    "number": "FG(214)",
    "string": "FG(222)",
    "boolean": "FG(220)",
    "date": "FG(180)",
    "default": "FG(179)",
    "table": {
      "lines": "RESET,FG(136)",
      "value": "RESET",
      "title": "BOLD,FG(214)",
      "bandRow": "BG(235)"
    },
    "tree": {
      "lines": "FG(136)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(214),BOLD",
        "text": "FG(230),BG(235),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(223),BOLD,UNDERLINE",
        "h2": "FG(214),BOLD,UNDERLINE",
        "h3": "FG(220),BOLD",
        "h4": "FG(180),UNDERLINE"
      },
      "line": "FG(136),FAINT",
      "link": {
        "text": "FG(214),UNDERLINE",
        "url": "FAINT"
      },
      "bullets": "FG(220),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(180),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(237),FG(231)"
    }
  },
  "rose": {
    "key": "BOLD,FG(125)",
    "number": "FG(167)",
    "string": "FG(132)",
    "boolean": "FG(204)",
    "date": "FG(96)",
    "default": "FG(240)",
    "table": {
      "lines": "RESET,FG(175)",
      "value": "RESET",
      "title": "BOLD,FG(125)",
      "bandRow": "BG(224)"
    },
    "tree": {
      "lines": "FG(175)",
      "curved": true
    },
    "md": {
      "codeBlock": {
        "line": "FG(167),BOLD",
        "text": "FG(239),BG(224),ITALIC",
        "theme": "openCurvedSpace"
      },
      "heads": {
        "h1": "FG(89),BOLD,UNDERLINE",
        "h2": "FG(125),BOLD,UNDERLINE",
        "h3": "FG(167),BOLD",
        "h4": "FG(132),UNDERLINE"
      },
      "line": "FG(175)",
      "link": {
        "text": "FG(167),UNDERLINE",
        "url": "FG(244),FAINT"
      },
      "bullets": "FG(125),BOLD",
      "list": "BOLD",
      "note": {
        "line": "FG(96),FAINT",
        "theme": "simpleLine"
      },
      "bg": "BG(231),FG(16)"
    }
  }
}
