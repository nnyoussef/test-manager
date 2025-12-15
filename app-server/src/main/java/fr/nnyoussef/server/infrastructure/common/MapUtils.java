package fr.nnyoussef.server.infrastructure.common;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;

public final class MapUtils {

    private MapUtils() throws InstantiationException {
        throw new InstantiationException();
    }


    public static Map<String, Object> deepCopyMap(Map<String, Object> jsMap) {
        Map<String, Object> javaMap = new HashMap<>();
        for (Map.Entry<String, Object> entry : jsMap.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                javaMap.put(entry.getKey(), deepCopyMap((Map<String, Object>) value));
            } else if (value instanceof List) {
                javaMap.put(entry.getKey(), deepCopyList((List<Object>) value));
            } else {
                javaMap.put(entry.getKey(), value); // primitive or String
            }
        }
        return javaMap;
    }

    public static List<Object> deepCopyList(List<Object> jsList) {
        List<Object> javaList = new LinkedList<>();
        for (Object item : jsList) {
            if (item instanceof Map) {
                javaList.add((item));
            } else if (item instanceof List) {
                javaList.add(deepCopyList((List<Object>) item));
            } else {
                javaList.add(item); // primitive or String
            }
        }
        return javaList;
    }
}
