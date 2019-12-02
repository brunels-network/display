
__all__ = ["Source"]


def _setState(state, val, default=None):
    try:
        result = state[val]
        if result:
            return result
        else:
            return default
    except:
        return default


class Source:
    """Holds information about a Source in the network"""
    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "name": [],
            "id": None,
            "notes": [],
        }

        self.setState(props)

    def __str__(self):
        return f"Source({self.getName()})"

    def getID(self):
        return self.state["id"]

    def getName(self):
        return self.state["name"]

    def setState(self, state):
        if not state:
            return

        self.state["name"] = _setState(state, "name")
        self.state["id"] = _setState(state, "id")
        self.state["notes"] = _setState(state, "notes", [])

    def toDry(self):
        return {"value": self.state}

    @staticmethod
    def unDry(value):
        return Source(value)

    @staticmethod
    def load(data):
        return Source(data)
