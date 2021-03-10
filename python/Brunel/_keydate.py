
__all__ = ["KeyDate"]


def _setState(state, val, default=None):
    try:
        result = state[val]
        if result:
            return result
        else:
            return default
    except Exception:
        return default


class KeyDate:
    """Holds information about a key date in the project"""
    def __init__(self, props=None, getHook=None):
        self._getHook = getHook

        self.state = {
            "name": None,
            "id": None,
            "description": None,
        }

        self.setState(props)

    def __str__(self):
        return f"KeyDate({self.getName()})"

    def __repr__(self):
        return self.__str__()

    def getID(self):
        return self.state["id"]

    def getName(self):
        return self.state["name"]

    def getDescription(self):
        return self.state["description"]

    def setState(self, state):
        if not state:
            return

        self.state["name"] = _setState(state, "name")
        self.state["id"] = _setState(state, "id")
        self.state["description"] = _setState(state, "description")

        if self.state["name"] == "None" or self.state["name"] is None:
            raise ValueError(f"No name for {self}?")

    def toDry(self):
        return self.state

    @staticmethod
    def unDry(value):
        return KeyDate(value)

    @staticmethod
    def load(data):
        return KeyDate(data)
